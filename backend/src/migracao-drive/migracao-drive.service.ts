import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractionService, ParcelaPagamento, AmbienteItem } from '../extraction/extraction.service';
import { UtilsService } from '../utils/utils.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require('adm-zip');
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

// ─── Mapeamento das pastas do Drive para status do ERP ───────────────────────
//
// Estrutura esperada do ZIP:
//   CLIENTES/
//     Andamento/         → status ORCAMENTO
//     Em finalização/    → status CONTRATO
//     Aguardando medidas finas/ → status CONTRATO
//     Produção/          → status PRODUCAO_MONTAGEM
//     Entregues/         → status PRODUCAO_MONTAGEM
//     Declinados/        → status CADASTRO  (encerrado/perdido)
//     CLIENTE/           → (pasta diretamente em CLIENTES) → status CADASTRO
//       <NOME_CLIENTE>/
//         ORÇAMENTO/
//         CONTRATO/
//         PROJETO TECNICO/
//         ...arquivos...

const MAPA_STATUS_DRIVE: Record<string, string> = {
  'andamento': 'ORCAMENTO',
  'em finalizacao': 'CONTRATO',
  'em finalização': 'CONTRATO',
  'aguardando medidas finas': 'CONTRATO',
  'aguardando medida fina': 'CONTRATO',
  'producao': 'PRODUCAO_MONTAGEM',
  'produção': 'PRODUCAO_MONTAGEM',
  'entregues': 'PRODUCAO_MONTAGEM',
  'entregue': 'PRODUCAO_MONTAGEM',
  'declinados': 'CADASTRO',
  'declinado': 'CADASTRO',
};

// Pastas que são categorias de arquivo dentro de cada cliente
const CATEGORIAS_ARQUIVO: Record<string, string> = {
  'orçamento': 'ORCAMENTO',
  'orcamento': 'ORCAMENTO',
  'contrato': 'CONTRATO',
  'contratos': 'CONTRATO',
  'projeto tecnico': 'PROJETO_TECNICO',
  'projeto técnico': 'PROJETO_TECNICO',
  'projeto atualizado': 'PROJETO_TECNICO',
  'plano corte': 'PLANO_CORTE',
  'plano de corte': 'PLANO_CORTE',
  'medidas': 'MEDICAO',
  'medidas gustavo': 'MEDICAO',
  'projeto': 'PROJETO',
  'fotos': 'FOTO',
  'foto': 'FOTO',
  'imagens': 'FOTO',
};

// ─── Tipos internos ──────────────────────────────────────────────────────────

export interface ArquivoMigracao {
  nome_original: string;
  caminho_drive: string;     // caminho completo dentro do zip
  categoria: string;         // ORCAMENTO | CONTRATO | FOTO | etc.
  mime_type: string;
  buffer: Buffer;
}

export interface ClienteMigracao {
  nome_drive: string;         // nome exato da pasta no Drive
  nome_cliente: string;       // nome normalizado
  status_drive: string;       // pasta pai no Drive (Andamento, Entregues, etc.)
  status_erp: string;         // status mapeado para o ERP
  arquivos: ArquivoMigracao[];
  dados_extraidos?: {
    cpf?: string | null;
    cnpj?: string | null;
    telefone?: string | null;
    contato_nome?: string | null;   // nome do contato (ex: "Catharina") — vem do orçamento
    endereco_cliente?: string | null;
    endereco_logradouro?: string | null;
    endereco_numero?: string | null;
    endereco_bairro?: string | null;
    endereco_cidade?: string | null;
    endereco_estado?: string | null;
    endereco_cep?: string | null;
    endereco_entrega?: string | null;
    texto_contexto?: string | null; // texto bruto do contrato para resolver CEP
    valor_contrato?: number | null;
    data_fechamento?: string | null;
    data_entrega?: string | null;
    ambientes?: string[];
    ambientes_com_valor?: AmbienteItem[];
    parcelas?: ParcelaPagamento[];
  };
}

export interface PreviewMigracao {
  total_clientes: number;
  clientes: Array<{
    nome_drive: string;
    nome_cliente: string;
    status_drive: string;
    status_erp: string;
    total_arquivos: number;
    arquivos_por_categoria: Record<string, number>;
    dados_extraidos?: ClienteMigracao['dados_extraidos'];
    alertas?: string[];
  }>;
  erros: string[];
  diagnostico_leitura?: {
    total_entries: number;
    total_diretorios: number;
    total_arquivos: number;
    arquivos_lidos: number;
    arquivos_ignorados: number;
    ignorados_por_motivo: Record<string, number>;
    exemplos_ignorados?: Record<string, string[]>;
  };
}

export interface ResultadoImportacao {
  criados: number;
  ignorados: number;         // clientes que já existiam
  erros: string[];
  detalhes: Array<{
    nome_cliente: string;
    acao: 'CRIADO' | 'IGNORADO' | 'ERRO';
    cliente_id?: number;
    motivo?: string;
  }>;
}

@Injectable()
export class MigracaoDriveService {
  private readonly logger = new Logger(MigracaoDriveService.name);

  private static readonly IGNORAR_MOTIVO = {
    DIRETORIO: 'diretorio',
    CAMINHO_CURTO: 'caminho_curto',
    ARQUIVO_OCULTO: 'arquivo_oculto',
    ARQUIVO_SISTEMA: 'arquivo_sistema',
    CAMINHO_NAO_IDENTIFICADO: 'caminho_nao_identificado',
    THUMBNAIL_OU_ARQUIVO_PEQUENO: 'thumbnail_ou_arquivo_pequeno',
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractionService: ExtractionService,
    private readonly utilsService: UtilsService,
  ) {}

  // ─── 1. Ler ZIP e montar preview (sem salvar nada) ───────────────────────

  async gerarPreview(
    zipBuffer: Buffer,
    opcoes?: { extrairDados?: boolean },
  ): Promise<PreviewMigracao> {
    const leitura = this.lerEstruturaDriveComDiagnostico(zipBuffer);
    const clientes = leitura.clientes;
    const erros: string[] = [];

    const previewClientes: PreviewMigracao['clientes'] = [];

    for (const cliente of clientes) {
      const arquivosPorCategoria: Record<string, number> = {};
      for (const arq of cliente.arquivos) {
        arquivosPorCategoria[arq.categoria] =
          (arquivosPorCategoria[arq.categoria] ?? 0) + 1;
      }

      let dados_extraidos: ClienteMigracao['dados_extraidos'] | undefined;
      let alertas: string[] = [];

      // Extrai dados dos PDFs/DOCXs se solicitado
      if (opcoes?.extrairDados) {
        try {
          const arquivosTexto = cliente.arquivos.filter(
            (a) =>
              a.mime_type === 'application/pdf' ||
              a.mime_type.includes('wordprocessingml') ||
              a.mime_type === 'application/msword',
          );

          if (arquivosTexto.length > 0) {
            const fakeFiles = arquivosTexto.map((a) => ({
              fieldname: 'files',
              originalname: a.nome_original,
              mimetype: a.mime_type,
              buffer: a.buffer,
              size: a.buffer.length,
            })) as Express.Multer.File[];

            const resultado =
              await this.extractionService.extrairDosArquivos(fakeFiles);

            const partes = resultado.consolidado.endereco_cliente_partes;
            dados_extraidos = {
              cpf: resultado.consolidado.cpfCnpj?.includes('-')
                ? resultado.consolidado.cpfCnpj
                : null,
              cnpj: resultado.consolidado.cpfCnpj?.includes('/')
                ? resultado.consolidado.cpfCnpj
                : null,
              telefone: resultado.consolidado.telefone,
              endereco_cliente: resultado.consolidado.endereco_cliente,
              endereco_logradouro: partes?.logradouro ?? null,
              endereco_numero: partes?.numero ?? null,
              endereco_bairro: partes?.bairro ?? null,
              endereco_cidade: partes?.cidade ?? null,
              endereco_estado: partes?.estado ?? null,
              endereco_cep: partes?.cep ?? null,
              endereco_entrega: resultado.consolidado.endereco_entrega,
              valor_contrato: resultado.consolidado.valorTotal,
              data_fechamento: resultado.consolidado.dataFechamento,
              ambientes: resultado.consolidado.ambientes,
            };
            alertas = resultado.divergencias;
          }
        } catch (err: any) {
          this.logger.warn(
            `Extração falhou para "${cliente.nome_cliente}": ${err.message}`,
          );
          erros.push(
            `Aviso: não foi possível extrair dados de "${cliente.nome_cliente}": ${err.message}`,
          );
        }
      }

      previewClientes.push({
        nome_drive: cliente.nome_drive,
        nome_cliente: cliente.nome_cliente,
        status_drive: cliente.status_drive,
        status_erp: cliente.status_erp,
        total_arquivos: cliente.arquivos.length,
        arquivos_por_categoria: arquivosPorCategoria,
        dados_extraidos,
        alertas,
      });
    }

    return {
      total_clientes: clientes.length,
      clientes: previewClientes,
      erros,
      diagnostico_leitura: leitura.diagnostico,
    };
  }

  // ─── 2. Importar de fato (cria clientes + arquivos no ERP) ──────────────

  async importar(
    zipBuffer: Buffer,
    opcoes?: {
      extrairDados?: boolean;
      usuario_id?: number;
      pular_existentes?: boolean;
    },
  ): Promise<ResultadoImportacao> {
    const clientes = this.lerEstruturaDrive(zipBuffer);
    const resultado: ResultadoImportacao = {
      criados: 0,
      ignorados: 0,
      erros: [],
      detalhes: [],
    };

    for (const cliente of clientes) {
      try {
        await this.importarCliente(cliente, opcoes ?? {}, resultado);
      } catch (err: any) {
        const msg = `Erro ao importar "${cliente.nome_cliente}": ${err.message}`;
        this.logger.error(msg);
        resultado.erros.push(msg);
        resultado.detalhes.push({
          nome_cliente: cliente.nome_cliente,
          acao: 'ERRO',
          motivo: err.message,
        });
      }
    }

    return resultado;
  }

  // ─── Importa um único cliente ────────────────────────────────────────────

  private async importarCliente(
    cliente: ClienteMigracao,
    opcoes: {
      extrairDados?: boolean;
      usuario_id?: number;
      pular_existentes?: boolean;
    },
    resultado: ResultadoImportacao,
  ) {
    // Verifica se já existe no ERP pelo nome — SEMPRE, independente de pular_existentes
    // pular_existentes=false apenas força recriar o fluxo, nunca duplica o cadastro
    const existente = await this.prisma.cliente.findFirst({
      where: { nome_completo: cliente.nome_cliente },
      select: { id: true, nome_completo: true },
    });

    if (existente) {
      const forcarRecriar = opcoes.pular_existentes === false;
      this.logger.log(`Cliente "${cliente.nome_cliente}" já existe (id ${existente.id})${forcarRecriar ? ' — forçando recriar fluxo' : ' — completando dados'}`);

      // Salva arquivos no cliente existente
      if (cliente.arquivos.length > 0) {
        await this.salvarArquivosCliente(existente.id, cliente.arquivos);
      }

      // Garante que o cliente existente apareça na lista de importados
      await this.prisma.cliente.update({
        where: { id: existente.id },
        data: { situacao: 'Importado do Drive' },
      });

      // Extrai dados sempre que extrairDados=true
      if (opcoes.extrairDados) {
        const dadosExtras = await this.extrairDadosCliente(cliente);

        const orcamentoExistente = await this.prisma.orcamentos.findFirst({
          where: { cliente_id: existente.id },
          select: { id: true },
        });

        if (!orcamentoExistente || forcarRecriar) {
          // Se forçar recriar, reseta primeiro
          if (forcarRecriar && orcamentoExistente) {
            await this.resetarFluxoCliente(existente.id);
          }
          await this.criarFluxoComercial(existente.id, cliente, dadosExtras ?? {});
        } else {
          this.logger.log(`[Fluxo] Cliente id ${existente.id} já tem orçamento — pulando.`);
        }

        // Atualiza dados cadastrais se estiverem vazios no existente
        await this.completarDadosCadastrais(existente.id, dadosExtras ?? {});
      }

      resultado.ignorados++;
      resultado.detalhes.push({
        nome_cliente: cliente.nome_cliente,
        acao: 'IGNORADO',
        cliente_id: existente.id,
        motivo: forcarRecriar ? 'Fluxo recriado' : 'Já existe — dados completados',
      });
      return;
    }

    // Extrai dados dos documentos se solicitado
    let dadosExtras: ClienteMigracao['dados_extraidos'] = {};
    if (opcoes.extrairDados) {
      dadosExtras = await this.extrairDadosCliente(cliente);
    }

    // ─── Resolve endereço em cascata ─────────────────────────────────────────
    type EndRes = { cep: string | null; logradouro: string | null; numero: string | null; bairro: string | null; cidade: string | null; estado: string | null };
    let enderecoResolvido: EndRes = { cep: null, logradouro: null, numero: null, bairro: null, cidade: null, estado: null };
    let fonteEndereco = '';

    // Estratégia 1: CEP já presente no documento
    if (dadosExtras?.endereco_cep) {
      enderecoResolvido = {
        cep: dadosExtras.endereco_cep,
        logradouro: dadosExtras.endereco_logradouro ?? null,
        numero: dadosExtras.endereco_numero ?? null,
        bairro: dadosExtras.endereco_bairro ?? null,
        cidade: dadosExtras.endereco_cidade ?? null,
        estado: dadosExtras.endereco_estado ?? null,
      };
      fonteEndereco = 'CEP do documento';
    }

    // Estratégia 2: busca pelo nome do logradouro + cidade no ViaCEP
    if (!enderecoResolvido.cep && dadosExtras?.endereco_cliente) {
      try {
        const resolvido = await this.utilsService.resolverCepDoEndereco(
          dadosExtras.endereco_cliente,
          dadosExtras.texto_contexto ?? undefined,
        );
        if (resolvido.cep || resolvido.logradouro) {
          // Mantém o número original do documento (mais confiável que o do ViaCEP)
          enderecoResolvido = {
            ...resolvido,
            numero: dadosExtras.endereco_numero ?? resolvido.numero,
          };
          fonteEndereco = 'ViaCEP por logradouro';
        }
      } catch (e: any) {
        this.logger.warn(`[Endereço] Falha ao resolver de "${cliente.nome_cliente}": ${e.message}`);
      }
    }

    if (fonteEndereco) {
      this.logger.log(
        `[Endereço] "${cliente.nome_cliente}" via ${fonteEndereco} → ${enderecoResolvido.cep ?? 'sem CEP'} | ${enderecoResolvido.logradouro}, ${enderecoResolvido.numero} - ${enderecoResolvido.bairro} - ${enderecoResolvido.cidade}/${enderecoResolvido.estado}`,
      );
    }

    // Complemento: endereço bruto original (máx 190 chars) — só se não resolveu nenhuma estratégia
    const endBruto = dadosExtras?.endereco_cliente ?? null;
    const enderecoComplemento =
      !enderecoResolvido.cep && endBruto
        ? endBruto.substring(0, 190)
        : null;

    // Verifica se CPF/CNPJ já está em uso por outro cliente para evitar unique constraint
    const cpfParaSalvar = await this.resolverCpfUnico(dadosExtras?.cpf ?? null);
    const cnpjParaSalvar = await this.resolverCnpjUnico(dadosExtras?.cnpj ?? null);

    // Cria o cliente no ERP
    const novoCliente = await this.prisma.cliente.create({
      data: {
        nome_completo: cliente.nome_cliente,
        nome_fantasia: dadosExtras?.contato_nome ?? null,
        status: cliente.status_erp,
        cpf: cpfParaSalvar,
        cnpj: cnpjParaSalvar,
        telefone: dadosExtras?.telefone ?? null,
        cep: enderecoResolvido.cep,
        endereco: enderecoResolvido.logradouro,
        numero: enderecoResolvido.numero,
        bairro: enderecoResolvido.bairro,
        cidade: enderecoResolvido.cidade,
        estado: enderecoResolvido.estado,
        complemento: enderecoComplemento,
        criado_por_usuario_id: opcoes.usuario_id ?? null,
        situacao: 'Importado do Drive',
      },
    });

    // Salva os arquivos
    if (cliente.arquivos.length > 0) {
      await this.salvarArquivosCliente(novoCliente.id, cliente.arquivos);
    }

    // Cria orçamento → venda (fechamento) → contrato → contas a receber
    await this.criarFluxoComercial(novoCliente.id, cliente, dadosExtras ?? {});

    resultado.criados++;
    resultado.detalhes.push({
      nome_cliente: cliente.nome_cliente,
      acao: 'CRIADO',
      cliente_id: novoCliente.id,
    });

    this.logger.log(`✅ Cliente "${cliente.nome_cliente}" criado (id ${novoCliente.id})`);
  }

  // ─── Dilui valor total igualmente entre N itens, distribuindo centavos no primeiro ──
  //
  // Ex: R$ 33.500,00 ÷ 7 ambientes = R$ 4.785,71 × 6 + R$ 4.785,74 (1º item absorve o resto)
  // Garante que a soma dos itens seja SEMPRE igual ao total original.

  // ─── Reset de fluxo comercial de um cliente (para reimportação) ─────────

  // Completa campos vazios de um cliente existente sem sobrescrever dados já preenchidos
  private async completarDadosCadastrais(
    clienteId: number,
    dados: NonNullable<ClienteMigracao['dados_extraidos']>,
  ) {
    const atual = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { cpf: true, cnpj: true, telefone: true, cep: true, endereco: true, nome_fantasia: true },
    });
    if (!atual) return;

    const update: Record<string, any> = {};

    if (!atual.nome_fantasia && dados.contato_nome) update.nome_fantasia = dados.contato_nome;
    if (!atual.telefone && dados.telefone) update.telefone = dados.telefone;

    if (!atual.cpf && dados.cpf) {
      const cpfLivre = await this.resolverCpfUnico(dados.cpf);
      if (cpfLivre) update.cpf = cpfLivre;
    }
    if (!atual.cnpj && dados.cnpj) {
      const cnpjLivre = await this.resolverCnpjUnico(dados.cnpj);
      if (cnpjLivre) update.cnpj = cnpjLivre;
    }

    if (!atual.cep && dados.endereco_cep) update.cep = dados.endereco_cep;
    if (!atual.endereco && dados.endereco_logradouro) update.endereco = dados.endereco_logradouro;

    // Marca sempre como importado do Drive para aparecer na lista de gerenciamento
    update.situacao = 'Importado do Drive';

    await this.prisma.cliente.update({ where: { id: clienteId }, data: update });
    if (Object.keys(update).length > 1) {
      this.logger.log(`[Cadastro] Cliente id ${clienteId} atualizado com: ${Object.keys(update).join(', ')}`);
    }
  }

  // Retorna null se o CPF já estiver em uso (evita unique constraint)
  private async resolverCpfUnico(cpf: string | null): Promise<string | null> {
    if (!cpf) return null;
    const existe = await this.prisma.cliente.findFirst({ where: { cpf }, select: { id: true } });
    if (existe) {
      this.logger.warn(`[CPF] ${cpf} já existe (id ${existe.id}) — importando sem CPF`);
      return null;
    }
    return cpf;
  }

  // Retorna null se o CNPJ já estiver em uso (evita unique constraint)
  private async resolverCnpjUnico(cnpj: string | null): Promise<string | null> {
    if (!cnpj) return null;
    const existe = await this.prisma.cliente.findFirst({ where: { cnpj }, select: { id: true } });
    if (existe) {
      this.logger.warn(`[CNPJ] ${cnpj} já existe (id ${existe.id}) — importando sem CNPJ`);
      return null;
    }
    return cnpj;
  }

  async statsCliente(clienteId: number) {
    const [orcamentos, arquivos, contas] = await Promise.all([
      this.prisma.orcamentos.count({ where: { cliente_id: clienteId } }),
      this.prisma.arquivos.count({ where: { owner_type: 'CLIENTE', owner_id: clienteId } }),
      this.prisma.contas_receber.count({ where: { cliente_id: clienteId } }),
    ]);
    return { _orcamentos: orcamentos, _arquivos: arquivos, _contas: contas };
  }

  async resetarFluxoCliente(clienteId: number) {
    // 1. Busca todas as vendas para apagar dependências
    const vendas = await this.prisma.vendas.findMany({
      where: { cliente_id: clienteId },
      select: { id: true },
    });
    const vendaIds = vendas.map((v) => v.id);

    if (vendaIds.length) {
      await this.prisma.contratos.deleteMany({ where: { venda_id: { in: vendaIds } } });
      await this.prisma.vendas_pagamentos.deleteMany({ where: { venda_id: { in: vendaIds } } });
      await this.prisma.vendas_itens.deleteMany({ where: { venda_id: { in: vendaIds } } });
      await this.prisma.vendas_comissoes.deleteMany({ where: { venda_id: { in: vendaIds } } });
      await this.prisma.vendas.deleteMany({ where: { id: { in: vendaIds } } });
    }

    // 2. Apaga TODAS as contas a receber do cliente (independente de origem)
    await this.prisma.contas_receber.deleteMany({ where: { cliente_id: clienteId } });

    // 3. Apaga orçamentos (itens em cascade pelo schema)
    await this.prisma.orcamentos.deleteMany({ where: { cliente_id: clienteId } });

    // 4. Apaga arquivos físicos e registros
    const arquivosBd = await this.prisma.arquivos.findMany({
      where: { owner_type: 'CLIENTE', owner_id: clienteId },
      select: { id: true, url: true },
    });
    for (const arq of arquivosBd) {
      try {
        const abs = arq.url.startsWith('/')
          ? path.join(process.cwd(), arq.url)
          : path.join(process.cwd(), '/', arq.url);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch { /* ignora erros de arquivo */ }
    }
    await this.prisma.arquivos.deleteMany({ where: { owner_type: 'CLIENTE', owner_id: clienteId } });

    // 5. Reseta status do cliente
    await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { status: 'CADASTRO', situacao: 'Importado do Drive' },
    });

    this.logger.log(`[Reset] Cliente id ${clienteId} limpo com sucesso.`);
    return { ok: true, mensagem: `Cliente id ${clienteId} resetado.` };
  }

  // Exclui completamente o cliente importado (cadastro + tudo vinculado)
  async excluirClienteImportado(clienteId: number) {
    // 1. Remove o fluxo comercial primeiro
    await this.resetarFluxoCliente(clienteId);

    // 2. Remove agendamentos (onDelete não é Cascade no schema)
    await this.prisma.agenda_loja.deleteMany({ where: { cliente_id: clienteId } }).catch(() => {});

    // 3. Remove o cadastro do cliente
    await this.prisma.cliente.delete({ where: { id: clienteId } });

    this.logger.log(`[Excluir] Cliente id ${clienteId} removido completamente.`);
    return { ok: true, mensagem: `Cliente id ${clienteId} excluído.` };
  }

  // Lista todos os clientes importados do Drive
  async listarImportados() {
    const clientes = await this.prisma.cliente.findMany({
      where: { situacao: 'Importado do Drive' },
      select: {
        id: true,
        nome_completo: true,
        cnpj: true,
        cpf: true,
        status: true,
        criado_em: true,
        _count: {
          select: {
            orcamentos: true,
            contas_receber: true,
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    });

    // Conta arquivos separadamente (owner_type/owner_id)
    const comArquivos = await Promise.all(
      clientes.map(async (c) => {
        const arquivos = await this.prisma.arquivos.count({
          where: { owner_type: 'CLIENTE', owner_id: c.id },
        });
        return {
          id: c.id,
          nome_completo: c.nome_completo,
          cnpj: c.cnpj,
          cpf: c.cpf,
          status: c.status,
          criado_em: c.criado_em,
          _orcamentos: c._count.orcamentos,
          _arquivos: arquivos,
          _contas: c._count.contas_receber,
        };
      }),
    );

    return comArquivos;
  }

  private diluirValor(total: number, quantidade: number): number[] {
    if (quantidade <= 0 || total <= 0) {
      return Array(Math.max(1, quantidade)).fill(0);
    }
    const totalCentavos = Math.round(total * 100);
    const base = Math.floor(totalCentavos / quantidade);
    const resto = totalCentavos - base * quantidade;
    return Array.from({ length: quantidade }, (_, i) => {
      const centavos = i === 0 ? base + resto : base;
      return Math.round(centavos) / 100;
    });
  }

  // Remove extensão e normaliza nome base para deduplicação
  private nomeBase(nomeArquivo: string): string {
    return nomeArquivo
      .replace(/\.(pdf|docx?|xlsx?|png|jpe?g)$/i, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  // Agrupa arquivos de uma categoria por nome base (deduplicação PDF/DOCX)
  private agruparPorNomeBase(arquivos: ArquivoMigracao[]): Map<string, ArquivoMigracao[]> {
    const mapa = new Map<string, ArquivoMigracao[]>();
    for (const arq of arquivos) {
      const chave = this.nomeBase(arq.nome_original);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(arq);
    }
    return mapa;
  }

  // ─── Cria fluxo comercial completo: Orçamento(s) → Venda → Contrato → Contas a Receber ──

  private async criarFluxoComercial(
    clienteId: number,
    cliente: ClienteMigracao,
    dados: NonNullable<ClienteMigracao['dados_extraidos']>,
  ) {
    const valorContrato = dados.valor_contrato ?? 0;
    const ambientes = dados.ambientes ?? [];
    const parcelas = dados.parcelas ?? [];

    // Agrupa por nome base para deduplicar PDF + DOCX do mesmo arquivo
    const arquivosOrcamento = cliente.arquivos.filter((a) => a.categoria === 'ORCAMENTO');
    const arquivosContrato = cliente.arquivos.filter((a) => a.categoria === 'CONTRATO');
    const gruposOrcamento = this.agruparPorNomeBase(arquivosOrcamento);
    const gruposContrato = this.agruparPorNomeBase(arquivosContrato);

    // Propostas únicas = grupos distintos por nome base
    const propostasUnicas = Array.from(gruposOrcamento.entries()).map(([nomeBase, arqs]) => ({
      nome: arqs[0].nome_original.replace(/\.(pdf|docx?)/i, '').trim(),
      arquivos: arqs,
    }));

    // Contratos únicos (idem)
    const contratosUnicos = Array.from(gruposContrato.entries()).map(([, arqs]) => ({
      nome: arqs[0].nome_original.replace(/\.(pdf|docx?)/i, '').trim(),
      arquivos: arqs,
    }));

    const temOrcamento = propostasUnicas.length > 0 || ambientes.length > 0 || valorContrato > 0;
    const temContrato = contratosUnicos.length > 0;

    if (!temOrcamento && !temContrato) return;

    this.logger.log(`[Fluxo] "${cliente.nome_cliente}": ${propostasUnicas.length} proposta(s) única(s), ${contratosUnicos.length} contrato(s) único(s)`);

    // ─── 1. Cria um orçamento por proposta única ────────────────────────────
    // itensVenda: itens do primeiro orçamento — usados como espelho na venda
    let itensVenda: { nome_ambiente: string; descricao: string; valor: number }[] = [];
    let orcamento: { id: number };
    let valorPrimeiroOrcamento = valorContrato; // usado para a venda

    // Helper: monta itens de um orçamento a partir dos dados extraídos daquele arquivo
    const montarItens = (
      dadosProposta: { valor: number; ambientesComValor: AmbienteItem[]; ambientes: string[] },
      nomeFallback: string,
    ): { nome_ambiente: string; descricao: string; valor: number }[] => {
      const { valor, ambientesComValor: acv, ambientes: ambs } = dadosProposta;
      const somaAcv = acv.reduce((s, a) => s + a.valor, 0);
      const tolerancia = valor > 0 ? valor * 0.02 : 1;
      const usarIndividuais = acv.length > 0 && (valor === 0 || Math.abs(somaAcv - valor) <= tolerancia);

      if (usarIndividuais) {
        return acv.map((a) => ({ nome_ambiente: a.nome, descricao: a.nome, valor: a.valor }));
      }
      const nomes = ambs.length > 0 ? ambs : [nomeFallback];
      const vals = this.diluirValor(valor, nomes.length);
      return nomes.map((n, i) => ({ nome_ambiente: n, descricao: n, valor: vals[i] }));
    };

    let primeiroOrcamento: { id: number } | null = null;

    for (const proposta of propostasUnicas) {
      // Extrai dados individualmente para esta proposta (PDF + DOCX do mesmo documento)
      this.logger.log(
        `[Proposta] "${proposta.nome}" → arquivos: ${proposta.arquivos.map((a) => a.nome_original).join(', ')}`,
      );
      const fakeFiles = proposta.arquivos
        .filter(
          (a) =>
            a.mime_type === 'application/pdf' ||
            a.mime_type.includes('wordprocessingml') ||
            a.mime_type === 'application/msword',
        )
        .map((a) => ({
          fieldname: 'files',
          originalname: a.nome_original,
          mimetype: a.mime_type,
          buffer: a.buffer,
          size: a.buffer.length,
        })) as Express.Multer.File[];

      let dadosProposta = {
        valor: 0,
        ambientesComValor: [] as AmbienteItem[],
        ambientes: [] as string[],
      };

      if (fakeFiles.length > 0) {
        try {
          const resultado = await this.extractionService.extrairDosArquivos(fakeFiles);
          const c = resultado.consolidado;
          dadosProposta = {
            valor: c.valorTotal ?? 0,
            ambientesComValor: c.ambientes_com_valor ?? [],
            ambientes: c.ambientes ?? [],
          };
        } catch (e) {
          this.logger.warn(`[Extração proposta] "${proposta.nome}": ${e.message}`);
        }
      }

      // Fallback: se não extraiu valor, usa o valor total consolidado do cliente
      if (dadosProposta.valor === 0 && valorContrato > 0) {
        dadosProposta.valor = valorContrato;
        dadosProposta.ambientesComValor = dados.ambientes_com_valor ?? [];
        dadosProposta.ambientes = ambientes;
      }

      const itens = montarItens(dadosProposta, proposta.nome);

      const orc = await this.prisma.orcamentos.create({
        data: {
          cliente_id: clienteId,
          cliente_nome_snapshot: cliente.nome_cliente,
          cliente_cpf_snapshot: dados.cpf ?? dados.cnpj ?? '',
          qtd_ambientes: itens.length,
          clausulas: [],
          itens: {
            create: itens.map((item) => ({
              nome_ambiente: item.nome_ambiente,
              descricao: item.descricao,
              observacao: '',
              valor_unitario: item.valor,
              valor_total: item.valor,
            })),
          },
        },
      });

      if (!primeiroOrcamento) {
        primeiroOrcamento = orc;
        itensVenda = itens;
        valorPrimeiroOrcamento = dadosProposta.valor > 0 ? dadosProposta.valor : valorContrato;
      }

      this.logger.log(
        `[Orçamento] #${orc.id} "${proposta.nome}" R$${dadosProposta.valor} (${itens.length} ambiente(s)) para "${cliente.nome_cliente}"`,
      );
    }

    // Se não havia nenhuma proposta (só contrato/parcelas), cria um orçamento genérico
    if (!primeiroOrcamento) {
      const nomesAmbientes = ambientes.length > 0 ? ambientes : ['Mobiliário sob medida'];
      const valoresItens = this.diluirValor(valorContrato, nomesAmbientes.length);
      itensVenda = nomesAmbientes.map((amb, idx) => ({
        nome_ambiente: amb,
        descricao: amb,
        valor: valoresItens[idx],
      }));
      const orc = await this.prisma.orcamentos.create({
        data: {
          cliente_id: clienteId,
          cliente_nome_snapshot: cliente.nome_cliente,
          cliente_cpf_snapshot: dados.cpf ?? dados.cnpj ?? '',
          qtd_ambientes: itensVenda.length,
          clausulas: [],
          itens: {
            create: itensVenda.map((item) => ({
              nome_ambiente: item.nome_ambiente,
              descricao: item.descricao,
              observacao: '',
              valor_unitario: item.valor,
              valor_total: item.valor,
            })),
          },
        },
      });
      primeiroOrcamento = orc;
      valorPrimeiroOrcamento = valorContrato;
      this.logger.log(`[Orçamento] #${orc.id} criado para "${cliente.nome_cliente}" (${itensVenda.length} ambiente(s))`);
    }

    orcamento = primeiroOrcamento;

    // Atualiza status do cliente para CRIAR_ORCAMENTO
    await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { status: 'CRIAR_ORCAMENTO' },
    });

    if (!temContrato && !parcelas.length) return; // só tinha orçamento — para aqui

    // ─── 2. Venda (Fechamento) ───────────────────────────────────────────
    const valorVendido = valorPrimeiroOrcamento > 0 ? valorPrimeiroOrcamento : 0;

    // Monta pagamentos a partir das parcelas; se não houver parcelas cria um genérico
    const pagamentosVenda = parcelas.length > 0
      ? parcelas.map((p) => ({
          venda_id: 0, // será substituído pelo createMany
          forma_pagamento_chave: p.forma,
          valor: p.valor,
          data_prevista_recebimento: p.vencimento ? new Date(p.vencimento) : null,
          data_recebimento: null,
          status_financeiro_chave: 'EM_ABERTO',
        }))
      : [{
          venda_id: 0,
          forma_pagamento_chave: 'OUTROS',
          valor: valorVendido,
          data_prevista_recebimento: dados.data_fechamento ? new Date(dados.data_fechamento) : null,
          data_recebimento: null,
          status_financeiro_chave: 'EM_ABERTO',
        }];

    const venda = await this.prisma.vendas.create({
      data: {
        cliente_id: clienteId,
        orcamento_id: orcamento.id,
        status: 'VENDA_FECHADA',
        data_venda: dados.data_fechamento ? new Date(dados.data_fechamento) : new Date(),
        endereco_entrega: dados.endereco_entrega ?? null,
        valor_vendido: valorVendido,
        valor_base_contrato: valorVendido,
        valor_bruto: valorVendido,
        valor_taxa_pagamento: 0,
        valor_nota_fiscal: 0,
        valor_total: valorVendido,
      },
    });

    // Salva itens da venda (espelho do primeiro orçamento — mesmos valores já calculados)
    await this.prisma.vendas_itens.createMany({
      data: itensVenda.map((item) => ({
        venda_id: venda.id,
        nome_ambiente: item.nome_ambiente,
        descricao: item.descricao,
        observacao: '',
        quantidade: 1,
        valor_unitario: item.valor,
        valor_total: item.valor,
      })),
    });

    // Salva pagamentos da venda
    if (pagamentosVenda.length) {
      await this.prisma.vendas_pagamentos.createMany({
        data: pagamentosVenda.map((p) => ({ ...p, venda_id: venda.id })),
      });
    }

    // Atualiza status do cliente para VENDA_FECHADA
    await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { status: 'VENDA_FECHADA' },
    });

    this.logger.log(`[Venda] #${venda.id} criada para "${cliente.nome_cliente}" (R$ ${valorVendido})`);

    // ─── 3. Contrato(s) ──────────────────────────────────────────────────
    // Cria um contrato por grupo único (deduplicado PDF/DOCX)
    if (contratosUnicos.length > 0) {
      const ano = new Date().getFullYear();
      for (let i = 0; i < contratosUnicos.length; i++) {
        const grupoContrato = contratosUnicos[i];
        const ultimoContrato = await this.prisma.contratos.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        const seq = String((ultimoContrato?.id ?? 0) + 1).padStart(4, '0');
        const numeroContrato = `CONT-${ano}-${seq}`;

        const contrato = await this.prisma.contratos.create({
          data: {
            cliente_id: clienteId,
            venda_id: venda.id,
            numero: numeroContrato,
            descricao: grupoContrato.nome || `Importado do Drive — ${cliente.nome_drive}`,
            status: 'VIGENTE',
            valor: valorVendido,
            data_inicio: dados.data_fechamento ? new Date(dados.data_fechamento) : new Date(),
            data_fim: dados.data_entrega ? new Date(dados.data_entrega) : null,
            data_assinatura: dados.data_fechamento ? new Date(dados.data_fechamento) : null,
            assinatura_presencial: true,
          },
        });

        this.logger.log(`[Contrato] ${numeroContrato} "${grupoContrato.nome}" (id ${contrato.id}) para "${cliente.nome_cliente}"`);
      }

      // Atualiza status do cliente para CONTRATO_ASSINADO
      await this.prisma.cliente.update({
        where: { id: clienteId },
        data: { status: 'CONTRATO_ASSINADO' },
      });
    }

    // ─── 4. Contas a Receber ─────────────────────────────────────────────
    if (valorVendido > 0) {
      const primeiraData = pagamentosVenda.find((p) => p.data_prevista_recebimento)?.data_prevista_recebimento ?? null;
      const somaParcelas = parcelas.reduce((s, p) => s + p.valor, 0);
      const tolerancia = valorVendido * 0.02;
      const parcelasCoerentes = parcelas.length > 0 && Math.abs(somaParcelas - valorVendido) <= tolerancia;

      if (parcelasCoerentes) {
        // Uma conta a receber por parcela
        for (let i = 0; i < parcelas.length; i++) {
          const p = parcelas[i];
          const formaLabel: Record<string, string> = { PIX: 'PIX', CHEQUE: 'Cheque', CARTAO: 'Cartão', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência', DINHEIRO: 'Dinheiro', OUTROS: 'Outros' };
          await this.prisma.contas_receber.create({
            data: {
              cliente_id: clienteId,
              origem_tipo: 'VENDA',
              origem_id: venda.id,
              descricao: `${cliente.nome_cliente} — Parcela ${i + 1}/${parcelas.length} (${formaLabel[p.forma] ?? p.forma})`,
              observacao: p.descricao.substring(0, 190),
              valor_original: p.valor,
              valor_compensado: 0,
              status: 'EM_ABERTO',
              forma_recebimento_chave: p.forma,
              vencimento_em: p.vencimento ? new Date(p.vencimento) : null,
            },
          });
        }
        this.logger.log(`[Financeiro] ${parcelas.length} parcela(s) criadas para "${cliente.nome_cliente}"`);
      } else {
        // Uma conta com o total
        await this.prisma.contas_receber.create({
          data: {
            cliente_id: clienteId,
            origem_tipo: 'VENDA',
            origem_id: venda.id,
            descricao: `${cliente.nome_cliente} — Fechamento (importado do Drive)`,
            valor_original: valorVendido,
            valor_compensado: 0,
            status: 'EM_ABERTO',
            vencimento_em: primeiraData,
          },
        });
        this.logger.log(`[Financeiro] 1 conta a receber R$ ${valorVendido} criada para "${cliente.nome_cliente}"`);
      }
    }
  }

  // ─── Salva arquivos físicos + registros no banco ─────────────────────────

  private async salvarArquivosCliente(
    clienteId: number,
    arquivos: ArquivoMigracao[],
  ) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'clientes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const arq of arquivos) {
      try {
        const ext = path.extname(arq.nome_original) || '';
        const nomeUnico = `${randomBytes(8).toString('hex')}${ext}`;
        const destino = path.join(uploadDir, nomeUnico);

        fs.writeFileSync(destino, arq.buffer);

        await this.prisma.arquivos.create({
          data: {
            owner_type: 'CLIENTE',
            owner_id: clienteId,
            categoria: arq.categoria,
            slot_key: null,
            url: `/uploads/clientes/${nomeUnico}`,
            filename: nomeUnico,
            nome: arq.nome_original,
            mime_type: arq.mime_type,
            tamanho: arq.buffer.length,
          },
        });
      } catch (err: any) {
        this.logger.warn(
          `Falha ao salvar arquivo "${arq.nome_original}" do cliente ${clienteId}: ${err.message}`,
        );
      }
    }
  }

  // ─── Extração de dados dos documentos do cliente ─────────────────────────

  private async extrairDadosCliente(
    cliente: ClienteMigracao,
  ): Promise<ClienteMigracao['dados_extraidos']> {
    const arquivosTexto = cliente.arquivos.filter(
      (a) =>
        a.mime_type === 'application/pdf' ||
        a.mime_type.includes('wordprocessingml') ||
        a.mime_type === 'application/msword',
    );

    if (!arquivosTexto.length) return {};

    const fakeFiles = arquivosTexto.map((a) => ({
      fieldname: 'files',
      originalname: a.nome_original,
      mimetype: a.mime_type,
      buffer: a.buffer,
      size: a.buffer.length,
    })) as Express.Multer.File[];

    const resultado = await this.extractionService.extrairDosArquivos(fakeFiles);
    const c = resultado.consolidado;

    // Concatena textos brutos de todos os arquivos para usar como contexto na busca de CEP
    const textoContexto = resultado.arquivos
      .map((a) => a.dados?.texto_bruto ?? '')
      .filter(Boolean)
      .join('\n')
      .substring(0, 3000); // limita para não sobrecarregar

    const partes = c.endereco_cliente_partes;
    return {
      cpf: c.cpfCnpj?.includes('-') ? c.cpfCnpj : null,
      cnpj: c.cpfCnpj?.includes('/') ? c.cpfCnpj : null,
      telefone: c.telefone,
      contato_nome: c.contato_nome ?? null,
      endereco_cliente: c.endereco_cliente,
      endereco_logradouro: partes?.logradouro ?? null,
      endereco_numero: partes?.numero ?? null,
      endereco_bairro: partes?.bairro ?? null,
      endereco_cidade: partes?.cidade ?? null,
      endereco_estado: partes?.estado ?? null,
      endereco_cep: partes?.cep ?? null,
      endereco_entrega: c.endereco_entrega,
      texto_contexto: textoContexto || null,
      valor_contrato: c.valorTotal,
      data_fechamento: c.dataFechamento,
      data_entrega: c.dataEntrega,
      ambientes: c.ambientes,
      ambientes_com_valor: c.ambientes_com_valor ?? [],
      parcelas: c.parcelas ?? [],
    };
  }

  // ─── Leitura e parse da estrutura do ZIP ─────────────────────────────────

  lerEstruturaDrive(zipBuffer: Buffer): ClienteMigracao[] {
    return this.lerEstruturaDriveComDiagnostico(zipBuffer).clientes;
  }

  private lerEstruturaDriveComDiagnostico(zipBuffer: Buffer): {
    clientes: ClienteMigracao[];
    diagnostico: PreviewMigracao['diagnostico_leitura'];
  } {
    // Valida magic bytes do ZIP: PK\x03\x04
    if (
      !zipBuffer ||
      zipBuffer.length < 4 ||
      zipBuffer[0] !== 0x50 ||
      zipBuffer[1] !== 0x4b
    ) {
      throw new BadRequestException(
        'Arquivo inválido. O arquivo enviado não é um ZIP válido.',
      );
    }

    let zip: AdmZip;
    try {
      zip = new AdmZip(zipBuffer);
    } catch (err: any) {
      this.logger.error(`AdmZip falhou ao parsear ZIP: ${err?.message}`);
      throw new BadRequestException(`Arquivo ZIP inválido ou corrompido: ${err?.message}`);
    }

    const entries = zip.getEntries();
    const diagnostico: NonNullable<PreviewMigracao['diagnostico_leitura']> = {
      total_entries: entries.length,
      total_diretorios: 0,
      total_arquivos: 0,
      arquivos_lidos: 0,
      arquivos_ignorados: 0,
      ignorados_por_motivo: {},
      exemplos_ignorados: {},
    };

    const contarIgnorado = (motivo: string, caminho?: string) => {
      diagnostico.arquivos_ignorados += 1;
      diagnostico.ignorados_por_motivo[motivo] =
        (diagnostico.ignorados_por_motivo[motivo] ?? 0) + 1;
      if (caminho) {
        if (!diagnostico.exemplos_ignorados![motivo]) {
          diagnostico.exemplos_ignorados![motivo] = [];
        }
        // Limita exemplos para não inflar payload do preview
        if (diagnostico.exemplos_ignorados![motivo].length < 5) {
          diagnostico.exemplos_ignorados![motivo].push(caminho);
        }
      }
    };

    // Loga as primeiras 20 entradas para diagnóstico
    this.logger.log(`ZIP tem ${entries.length} entradas. Primeiras 20:`);
    entries.slice(0, 20).forEach((e) =>
      this.logger.log(`  [${e.isDirectory ? 'DIR' : 'FILE'}] ${e.entryName}`),
    );

    const clientesMap = new Map<string, ClienteMigracao>();

    for (const entry of entries) {
      if (entry.isDirectory) {
        diagnostico.total_diretorios += 1;
        contarIgnorado(MigracaoDriveService.IGNORAR_MOTIVO.DIRETORIO, entry.entryName);
        continue;
      }
      diagnostico.total_arquivos += 1;

      const fullPath = entry.entryName.replace(/\\/g, '/');
      const parts = fullPath.split('/').filter(Boolean);

      // Ignora arquivos na raiz do ZIP ou arquivos de sistema
      if (parts.length < 2) {
        contarIgnorado(MigracaoDriveService.IGNORAR_MOTIVO.CAMINHO_CURTO, fullPath);
        continue;
      }
      if (parts[parts.length - 1].startsWith('.')) {
        contarIgnorado(MigracaoDriveService.IGNORAR_MOTIVO.ARQUIVO_OCULTO, fullPath);
        continue;
      }
      if (parts[parts.length - 1].toLowerCase() === 'desktop.ini') {
        contarIgnorado(MigracaoDriveService.IGNORAR_MOTIVO.ARQUIVO_SISTEMA, fullPath);
        continue;
      }

      const info = this.resolverCaminhoCliente(parts);
      if (!info) {
        contarIgnorado(MigracaoDriveService.IGNORAR_MOTIVO.CAMINHO_NAO_IDENTIFICADO, fullPath);
        continue;
      }

      const { nomeCliente, statusDrive, statusErp, categoria } = info;
      const chave = nomeCliente.toUpperCase();

      if (!clientesMap.has(chave)) {
        clientesMap.set(chave, {
          nome_drive: nomeCliente,
          nome_cliente: this.normalizarNomeCliente(nomeCliente),
          status_drive: statusDrive,
          status_erp: statusErp,
          arquivos: [],
        });
      }

      const nomeArquivo = parts[parts.length - 1];
      const mime = this.inferirMime(nomeArquivo);
      const buffer = entry.getData();

      // Ignora arquivos de sistema e muito pequenos (thumbnails do Drive)
      if (buffer.length < 100 && !nomeArquivo.toLowerCase().endsWith('.txt')) {
        contarIgnorado(MigracaoDriveService.IGNORAR_MOTIVO.THUMBNAIL_OU_ARQUIVO_PEQUENO, fullPath);
        continue;
      }

      clientesMap.get(chave)!.arquivos.push({
        nome_original: nomeArquivo,
        caminho_drive: fullPath,
        categoria,
        mime_type: mime,
        buffer,
      });
      diagnostico.arquivos_lidos += 1;
    }

    this.logger.log(
      `[Leitura ZIP] arquivos=${diagnostico.total_arquivos}, lidos=${diagnostico.arquivos_lidos}, ignorados=${diagnostico.arquivos_ignorados}, clientes=${clientesMap.size}`,
    );
    if (diagnostico.arquivos_ignorados > 0) {
      this.logger.log(
        `[Leitura ZIP] ignorados_por_motivo=${JSON.stringify(diagnostico.ignorados_por_motivo)}`,
      );
    }

    return { clientes: Array.from(clientesMap.values()), diagnostico };
  }

  // ─── Resolve nome do cliente e status a partir do caminho de pasta ───────
  //
  // Estruturas suportadas (o Drive baixa como ZIP com pasta raiz extra):
  //
  // A) Drive baixa pasta única de cliente:
  //    EGYDIO CONSTRUTORA-20260325T.../
  //      EGYDIO CONSTRUTORA/          ← nome do cliente
  //        ORÇAMENTO/                 ← categoria
  //          arquivo.pdf
  //        CONTRATO/
  //          arquivo.pdf
  //
  // B) Drive baixa pasta CLIENTES completa:
  //    CLIENTES-20260325T.../
  //      CLIENTES/
  //        Entregues/                 ← status
  //          EGYDIO CONSTRUTORA/      ← nome do cliente
  //            ORÇAMENTO/             ← categoria
  //              arquivo.pdf
  //
  // C) Sem pasta raiz extra:
  //    CLIENTES/
  //      Entregues/
  //        EGYDIO CONSTRUTORA/
  //          ORÇAMENTO/
  //            arquivo.pdf

  private resolverCaminhoCliente(
    parts: string[],
  ): { nomeCliente: string; statusDrive: string; statusErp: string; categoria: string } | null {
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const isCategoriaConhecida = (s: string) =>
      this.resolverCategoria(norm(s)) !== null;

    const isStatusConhecido = (s: string) =>
      MAPA_STATUS_DRIVE[norm(s)] !== undefined;

    // ── Procura âncora CLIENTES em qualquer profundidade ────────────────────
    const idxClientes = parts.findIndex((p) => norm(p) === 'clientes');

    if (idxClientes !== -1) {
      // após CLIENTES: [status?]/[nomeCliente]/[categoria?]/arquivo
      const after = parts.slice(idxClientes + 1);
      if (after.length < 2) return null;

      if (isStatusConhecido(after[0]) && after.length >= 3) {
        // CLIENTES/Status/NomeCliente/[Categoria/]arquivo
        const statusDrive = after[0];
        const nomeCliente = after[1];
        const categoria = after.length >= 4
          ? (this.resolverCategoria(norm(after[2])) ?? 'DOCUMENTO')
          : 'DOCUMENTO';
        return {
          nomeCliente,
          statusDrive,
          statusErp: MAPA_STATUS_DRIVE[norm(statusDrive)],
          categoria,
        };
      } else {
        // CLIENTES/NomeCliente/[Categoria/]arquivo
        const nomeCliente = after[0];
        const categoria = after.length >= 3
          ? (this.resolverCategoria(norm(after[1])) ?? 'DOCUMENTO')
          : 'DOCUMENTO';
        return {
          nomeCliente,
          statusDrive: 'CLIENTES',
          statusErp: 'CADASTRO',
          categoria,
        };
      }
    }

    // ── Sem âncora CLIENTES ────────────────────────────────────────────────
    // Estratégia: varrer parts de trás para frente procurando categoria conhecida
    // Suporta subpastas dentro da categoria:
    //   CLIENTE/ORÇAMENTO/01/arquivo.pdf      → categoria ORÇAMENTO, cliente CLIENTE
    //   PASTA_RAIZ/CLIENTE/ORÇAMENTO/arquivo.pdf  → idem
    //   PASTA_RAIZ/CLIENTE/ORÇAMENTO/01/arquivo.pdf → idem

    if (parts.length < 2) return null;

    // Varre de trás para frente (ignorando o arquivo = último elemento)
    // procura a primeira pasta que seja categoria conhecida
    for (let i = parts.length - 2; i >= 1; i--) {
      if (isCategoriaConhecida(parts[i])) {
        const nomeCliente = parts[i - 1];

        // Se o candidato a cliente também é uma categoria → ignora esse arquivo
        // Ex: ORÇAMENTO/01/arquivo.pdf — "ORÇAMENTO" seria o cliente, mas é categoria
        if (isCategoriaConhecida(nomeCliente) || isStatusConhecido(nomeCliente)) {
          // Continua procurando uma categoria mais "externa" no caminho.
          // Isso cobre casos como CLIENTE/ORÇAMENTO/MEDIDAS/arquivo.pdf
          // onde MEDIDAS é subpasta, mas o cliente real está em parts[i-2].
          continue;
        }

        const categoria = this.resolverCategoria(norm(parts[i])) ?? 'DOCUMENTO';

        // Verifica se antes do cliente há um status conhecido
        const statusDrive = i >= 2 ? parts[i - 2] : parts[0];
        const statusErp = isStatusConhecido(statusDrive)
          ? MAPA_STATUS_DRIVE[norm(statusDrive)]
          : 'ORCAMENTO';

        return { nomeCliente, statusDrive, statusErp, categoria };
      }
    }

    // Fallback: PASTA_RAIZ/NOME_CLIENTE/arquivo.pdf
    // Só aceita se o nome não for uma categoria ou status conhecidos
    if (parts.length >= 3) {
      const nomeCliente = parts[1];
      if (isCategoriaConhecida(nomeCliente) || isStatusConhecido(nomeCliente)) {
        return null;
      }
      return {
        nomeCliente,
        statusDrive: parts[0],
        statusErp: 'ORCAMENTO',
        categoria: 'DOCUMENTO',
      };
    }

    return null;
  }

  private resolverCategoria(nomePasta: string): string | null {
    return CATEGORIAS_ARQUIVO[nomePasta] ?? null;
  }

  // ─── Utilitários ─────────────────────────────────────────────────────────

  private normalizarNomeCliente(nome: string): string {
    // Capitaliza cada palavra
    return nome
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }

  private inferirMime(nomeArquivo: string): string {
    const ext = path.extname(nomeArquivo).toLowerCase();
    const mimes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xml': 'application/xml',
    };
    return mimes[ext] ?? 'application/octet-stream';
  }
}
