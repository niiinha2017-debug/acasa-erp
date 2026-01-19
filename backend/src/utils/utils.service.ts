import { Injectable, HttpException } from '@nestjs/common'

@Injectable()
export class UtilsService {
  async buscarCnpj(cnpj: string) {
    const limpo = String(cnpj || '').replace(/\D/g, '')
    if (limpo.length !== 14) {
      throw new HttpException('CNPJ inválido', 400)
    }

    const url = `https://brasilapi.com.br/api/cnpj/v1/${limpo}`

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ACASA-ERP' },
      })

      const text = await res.text()

      // Se a BrasilAPI não achou / bloqueou / etc, repassa status + mensagem
      if (!res.ok) {
        // tenta extrair message do json, se existir
        let msg = text
        try {
          const j = JSON.parse(text)
          msg = j?.message || msg
        } catch {}

        throw new HttpException(msg || 'Erro ao consultar CNPJ', res.status)
      }

      const data: any = JSON.parse(text)
      const s = (x: any) => String(x ?? '').trim()
      const est = data.estabelecimento || {}

      return {
        razao_social: s(data.razao_social),
        nome_fantasia: s(est.nome_fantasia || data.nome_fantasia),
        telefone: s(est.ddd1 && est.telefone1 ? `${est.ddd1}${est.telefone1}` : ''),
        cep: s(est.cep || data.cep),
        endereco: s(est.logradouro || data.logradouro),
        numero: s(est.numero || data.numero),
        bairro: s(est.bairro || data.bairro),
        cidade: s(est.cidade?.nome || est.municipio || data.municipio || ''),
        estado: s(est.estado?.sigla || est.uf || data.uf || ''),
        ie: s(data.inscricoes_estaduais?.[0]?.inscricao_estadual || ''),
      }
    } catch (err) {
      // se já for HttpException, só repassa
      if (err instanceof HttpException) throw err
      throw new HttpException('Falha ao consultar serviço de CNPJ', 500)
    }
  }
}

