import { Injectable, HttpException } from '@nestjs/common';
import { getStatusColorsConfig } from '../shared/constantes/etapas-cores';

@Injectable()
export class UtilsService {
  getStatusColorsConfig() {
    return getStatusColorsConfig();
  }
  async buscarCnpj(cnpj: string) {
    const limpo = String(cnpj || '').replace(/\D/g, '');
    if (limpo.length !== 14) {
      throw new HttpException('CNPJ inválido', 400);
    }

    const url = `https://brasilapi.com.br/api/cnpj/v1/${limpo}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ACASA-ERP' },
      });

      const text = await res.text();

      // Se a BrasilAPI não achou / bloqueou / etc, repassa status + mensagem
      if (!res.ok) {
        // tenta extrair message do json, se existir
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.message || msg;
        } catch {}

        throw new HttpException(msg || 'Erro ao consultar CNPJ', res.status);
      }

      const data: any = JSON.parse(text);
      const s = (x: any) => String(x ?? '').trim();
      const est = data.estabelecimento || {};

      return {
        razao_social: s(data.razao_social),
        nome_fantasia: s(est.nome_fantasia || data.nome_fantasia),
        telefone: s(
          est.ddd1 && est.telefone1 ? `${est.ddd1}${est.telefone1}` : '',
        ),
        cep: s(est.cep || data.cep),
        endereco: s(est.logradouro || data.logradouro),
        numero: s(est.numero || data.numero),
        bairro: s(est.bairro || data.bairro),
        cidade: s(est.cidade?.nome || est.municipio || data.municipio || ''),
        estado: s(est.estado?.sigla || est.uf || data.uf || ''),
        ie: s(data.inscricoes_estaduais?.[0]?.inscricao_estadual || ''),
      };
    } catch (err) {
      // se já for HttpException, só repassa
      if (err instanceof HttpException) throw err;
      throw new HttpException('Falha ao consultar serviço de CNPJ', 500);
    }
  }

  async buscarCep(cep: string) {
    const n = String(cep ?? '').replace(/\D/g, '');
    if (n.length !== 8) {
      return null;
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${n}/json`, {
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as {
        erro?: boolean;
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      return data?.erro ? null : data;
    } catch {
      return null;
    }
  }

  // Busca CEP pelo endereço usando ViaCEP: /ws/{UF}/{cidade}/{logradouro}/json/
  // Retorna o primeiro resultado encontrado ou null
  async buscarCepPorEndereco(params: {
    uf: string;
    cidade: string;
    logradouro: string;
  }): Promise<{ cep: string; logradouro: string; bairro: string; localidade: string; uf: string } | null> {
    try {
      const uf = encodeURIComponent(params.uf.trim().toUpperCase());
      const cidade = encodeURIComponent(params.cidade.trim());
      const logradouro = encodeURIComponent(params.logradouro.trim());
      const url = `https://viacep.com.br/ws/${uf}/${cidade}/${logradouro}/json/`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json() as any;
      // ViaCEP retorna array quando busca por endereço
      if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
        return data[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  // Tenta extrair UF/cidade de uma string de endereço e buscar o CEP
  // textoContexto: texto mais amplo do documento (para buscar cidade mesmo que não esteja no endereço)
  async resolverCepDoEndereco(
    enderecoCompleto: string,
    textoContexto?: string,
  ): Promise<{
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
  }> {
    const vazio = { cep: null, logradouro: null, numero: null, bairro: null, cidade: null, estado: null };
    if (!enderecoCompleto) return vazio;

    // Texto de busca: endereço + contexto completo
    const textoTotal = textoContexto
      ? `${enderecoCompleto} ${textoContexto}`
      : enderecoCompleto;

    // Extrai UF abreviada somente em contexto de endereço (ex: "- SP," / "/SP," / "Preto - SP" / "SP, 14096")
    // Evita capturar siglas como "RG", "CPF", "MG" que aparecem em outros contextos
    const UFS_BRASIL = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);
    const ufM = textoTotal.match(/[-\/,\s]([A-Z]{2})(?:\s*[,\/\-]\s*(?:\d{5}|$)|\s*$)/gm);
    let uf: string | null = null;
    if (ufM) {
      for (const m of ufM) {
        const sigla = m.replace(/[^A-Z]/g, '');
        if (UFS_BRASIL.has(sigla)) { uf = sigla; break; }
      }
    }

    // Extrai número do logradouro
    const numM =
      enderecoCompleto.match(/n[º°o]?\s*(\d+)/i) ||
      enderecoCompleto.match(/,\s*(\d+)/);
    const numero = numM?.[1] ?? null;

    // Extrai logradouro (tudo antes do número ou da primeira vírgula)
    let logradouro: string | null = null;
    const logM = enderecoCompleto.match(
      /^((?:Rua|Avenida|Av\.|Alameda|Al\.|Travessa|Rodovia)\s+[A-Za-zÀ-ÿ\s]+?)(?:\s+n[º°o]?|\s*,|\s*\d)/i,
    );
    if (logM?.[1]) logradouro = logM[1].trim();

    // Cidades conhecidas — busca no texto completo (contexto) priorizando cidades mais específicas
    // Ribeirão Preto vem antes de São Paulo para evitar falso positivo quando bairro menciona "São Paulo"
    const cidadesConhecidas = [
      'Ribeirão Preto',
      'Ribeirao Preto',
      'Campinas',
      'São Carlos',
      'Sao Carlos',
      'Bauru',
      'Araraquara',
      'Franca',
      'Sertãozinho',
      'Jaboticabal',
      // São Paulo por último — capital só se nenhuma outra cidade for encontrada
      'São Paulo',
      'Sao Paulo',
    ];

    let cidade: string | null = null;

    // Primeiro tenta encontrar a cidade pelo padrão "na cidade de X" ou "cidade de X"
    const cidadeExplicitaM = textoTotal.match(
      /(?:na cidade de|cidade de|município de|municipio de)\s+([A-Za-zÀ-ÿ\s]{3,30}?)(?:\s+na\s+Rua|\s+no\s+|,|\.|$)/i,
    );
    if (cidadeExplicitaM?.[1]) {
      cidade = cidadeExplicitaM[1].trim();
    }

    // Se não encontrou explicitamente, busca pela lista de cidades conhecidas no contexto
    if (!cidade) {
      for (const c of cidadesConhecidas) {
        if (textoTotal.toLowerCase().includes(c.toLowerCase())) {
          cidade = c;
          break;
        }
      }
    }

    if (!logradouro || !cidade) return vazio;

    const ufFinal = uf ?? 'SP'; // fallback SP para a A Casa Planejados
    const resultado = await this.buscarCepPorEndereco({
      uf: ufFinal,
      cidade,
      logradouro,
    });

    if (!resultado) return { ...vazio, logradouro, numero, cidade, estado: ufFinal };

    return {
      cep: resultado.cep ?? null,
      logradouro: resultado.logradouro ?? logradouro,
      numero,
      bairro: resultado.bairro ?? null,
      cidade: resultado.localidade ?? cidade,
      estado: resultado.uf ?? ufFinal,
    };
  }
}
