import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractionService } from '../extraction/extraction.service';
import { AgendaService } from '../agenda/agenda.service';
import { validarTransicaoStatusCliente } from '../shared/constantes/status-matrix';
import * as fs from 'fs';
import * as path from 'path';

export function getUploadFolderFromOwnerType(ownerType: string) {
  if (ownerType === 'MEDICAO_ORCAMENTO') return 'medicao_orcamento';
  if (ownerType === 'MEDICAO_ORCAMENTO_AMBIENTE')
    return 'medicao_orcamento_ambiente';
  if (ownerType === 'MEDICAO_ORCAMENTO_PAREDE')
    return 'medicao_orcamento_parede';
  if (ownerType === 'AGENDA_LOJA') return 'agenda_loja';
  return ownerType.toLowerCase() + 's';
}

function getUploadFolderAliases(ownerType: string) {
  const canonical = getUploadFolderFromOwnerType(ownerType);
  const legacy = ownerType.toLowerCase() + 's';
  return [...new Set([canonical, legacy].filter(Boolean))];
}

@Injectable()
export class ArquivosService {
  private readonly logger = new Logger(ArquivosService.name);

  constructor(
    private prisma: PrismaService,
    private extractionService: ExtractionService,
    private readonly agendaService: AgendaService,
  ) {}

  private normUpper(v: any) {
    const s = String(v ?? '')
      .trim()
      .toUpperCase();
    return s.length ? s : null;
  }

  private ownerType(v: any) {
    const s = this.normUpper(v);
    if (!s) throw new BadRequestException('owner_type é obrigatório.');
    if (!/^[A-Z0-9_]+$/.test(s))
      throw new BadRequestException('owner_type inválido.');
    return s;
  }

  private ownerId(v: any) {
    const n = Number(v);
    if (!n || n <= 0) throw new BadRequestException('owner_id inválido.');
    return n;
  }

  private folderFromOwnerType(ownerType: string) {
    return getUploadFolderFromOwnerType(ownerType);
  }

  private resolveArquivoFisico(arquivo: {
    owner_type: string;
    url?: string | null;
  }) {
    const url = String(arquivo.url || '').trim();
    if (!url) return null;

    const rel = url.replace(/^\//, '').replace(/^uploads[\/\\]+/, '');
    if (!rel) return null;

    const absAtual = path.join(process.cwd(), 'uploads', rel);
    if (fs.existsSync(absAtual)) {
      return { abs: absAtual, url: `/uploads/${rel.replace(/\\/g, '/')}` };
    }

    const parts = rel.split(/[\/\\]+/).filter(Boolean);
    if (parts.length < 2) return null;

    const [, ...rest] = parts;
    const suffix = rest.join('/');
    for (const folder of getUploadFolderAliases(arquivo.owner_type)) {
      const relAlternativo = [folder, suffix].filter(Boolean).join('/');
      const absAlternativo = path.join(process.cwd(), 'uploads', relAlternativo);
      if (fs.existsSync(absAlternativo)) {
        return {
          abs: absAlternativo,
          url: `/uploads/${relAlternativo.replace(/\\/g, '/')}`,
        };
      }
    }

    return null;
  }

  private normalizarArquivo<T extends { owner_type: string; url?: string | null }>(
    arquivo: T,
  ): T {
    const resolvido = this.resolveArquivoFisico(arquivo);
    if (!resolvido || resolvido.url === arquivo.url) return arquivo;
    return { ...arquivo, url: resolvido.url };
  }

  private round2(n: number) {
    return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
  }

  private assinaturaConsolidacaoCliente(
    arquivos: Array<{
      id: number;
      criado_em: Date;
      tamanho?: number | null;
      categoria?: string | null;
      nome?: string | null;
      filename: string;
    }>,
    orcamentoArquivoIds?: number[],
  ) {
    const rows = [...arquivos]
      .map((a) => ({
        id: Number(a.id || 0),
        criado_em: new Date(a.criado_em).toISOString(),
        tamanho: Number(a.tamanho || 0),
        categoria: this.categoriaEfetiva(a),
        nome: a.nome || a.filename || '',
      }))
      .sort((a, b) => a.id - b.id);
    const orcIds = [...new Set((orcamentoArquivoIds || []).map(Number).filter((n) => n > 0))]
      .sort((a, b) => a - b);
    return JSON.stringify({ rows, orcIds });
  }

  private extrairSnapshotConsolidacao(payload: any) {
    if (
      !payload ||
      typeof payload !== 'object' ||
      payload.schema !== 'IMPORTACAO_CACHE_V1' ||
      !payload.assinatura_arquivos ||
      !payload.consolidado
    ) {
      return null;
    }
    return payload;
  }

  private async buscarSnapshotConsolidacaoCliente(
    clienteId: number,
    assinaturaArquivos: string,
  ) {
    const rows = await this.prisma.ordem_servico.findMany({
      where: {
        cliente_id: clienteId,
        origem: 'IMPORTACAO_LEITURA',
      },
      select: {
        id: true,
        criado_em: true,
        comissionados: true,
      },
      orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
      take: 10,
    });

    for (const row of rows as any[]) {
      const snapshot = this.extrairSnapshotConsolidacao(row?.comissionados);
      if (!snapshot) continue;
      if (snapshot.assinatura_arquivos === assinaturaArquivos) {
        return snapshot.consolidado;
      }
    }
    return null;
  }

  private async salvarSnapshotConsolidacaoCliente(
    clienteId: number,
    assinaturaArquivos: string,
    consolidado: any,
  ) {
    const payload = {
      schema: 'IMPORTACAO_CACHE_V1',
      assinatura_arquivos: assinaturaArquivos,
      consolidado,
      gerado_em: new Date().toISOString(),
    };

    const dataEntrega = this.parseDataEntregaImportacao(
      consolidado?.financeiro?.data_entrega_prevista,
    );

    const cacheExistente = await this.prisma.ordem_servico.findFirst({
      where: {
        cliente_id: clienteId,
        origem: 'IMPORTACAO_LEITURA',
      },
      select: {
        id: true,
        comissionados: true,
      },
      orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
    });

    const ehCacheExistente = this.extrairSnapshotConsolidacao(
      cacheExistente?.comissionados,
    );

    if (cacheExistente?.id && ehCacheExistente) {
      await this.prisma.ordem_servico.update({
        where: { id: cacheExistente.id },
        data: {
          data_entrega_prevista: dataEntrega,
          observacao: 'Cache de consolidação gerado na importação de documentos',
          comissionados: payload as any,
        },
      });
      return;
    }

    await this.prisma.ordem_servico.create({
      data: {
        cliente_id: clienteId,
        data_entrega_prevista: dataEntrega,
        origem: 'IMPORTACAO_LEITURA',
        observacao: 'Cache de consolidação gerado na importação de documentos',
        comissionados: payload as any,
      },
    });
  }

  private async preAquecerConsolidacaoCliente(clienteId: number) {
    try {
      const consolidado = await this.consolidacaoCliente(clienteId, {
        ignorarCache: true,
      });
      return consolidado;
    } catch (error: any) {
      this.logger.warn(
        `Falha ao pré-processar importação do cliente ${clienteId}: ${error?.message || error}`,
      );
      return null;
    }
  }

  /**
   * Evita misturar valor_total de um arquivo com parcelas de outro.
   * Para o financeiro, escolhe um único documento de contrato como fonte oficial.
   */
  private escolherDocumentoFinanceiroOficial(
    arquivos: Array<import('../extraction/extraction.service').ResultadoArquivo>,
  ): {
    dados: import('../extraction/extraction.service').DadosExtraidos | null;
    nomeArquivo: string | null;
  } {
    const candidatos = arquivos
      .map((arquivo, idx) => {
        const dados = arquivo.dados;
        if (!dados) return null;
        const valorTotal = Number(dados.valorTotal ?? 0);
        const parcelas = Array.isArray(dados.parcelas) ? dados.parcelas : [];
        const somaParcelas = this.round2(
          parcelas.reduce((acc, p) => acc + Number(p?.valor || 0), 0),
        );
        const temValor = valorTotal > 0;
        const temParcelas = parcelas.length > 0;
        const diferenca = temValor && temParcelas
          ? Math.abs(this.round2(valorTotal - somaParcelas))
          : Number.POSITIVE_INFINITY;
        const tolerancia = temValor ? Math.max(1, valorTotal * 0.02) : 0;
        const coerente = temValor && temParcelas && diferenca <= tolerancia;

        return {
          idx,
          arquivo,
          dados,
          valorTotal,
          parcelasCount: parcelas.length,
          diferenca,
          coerente,
          temValor,
          temParcelas,
        };
      })
      .filter(Boolean) as Array<{
      idx: number;
      arquivo: import('../extraction/extraction.service').ResultadoArquivo;
      dados: import('../extraction/extraction.service').DadosExtraidos;
      valorTotal: number;
      parcelasCount: number;
      diferenca: number;
      coerente: boolean;
      temValor: boolean;
      temParcelas: boolean;
    }>;

    if (!candidatos.length) {
      return { dados: null, nomeArquivo: null };
    }

    candidatos.sort((a, b) => {
      if (Number(b.coerente) !== Number(a.coerente)) {
        return Number(b.coerente) - Number(a.coerente);
      }
      if (Number(b.temValor) !== Number(a.temValor)) {
        return Number(b.temValor) - Number(a.temValor);
      }
      if (Number(b.temParcelas) !== Number(a.temParcelas)) {
        return Number(b.temParcelas) - Number(a.temParcelas);
      }
      if (b.parcelasCount !== a.parcelasCount) {
        return b.parcelasCount - a.parcelasCount;
      }
      if (a.diferenca !== b.diferenca) {
        return a.diferenca - b.diferenca;
      }
      if (b.valorTotal !== a.valorTotal) {
        return b.valorTotal - a.valorTotal;
      }
      return a.idx - b.idx;
    });

    const escolhido = candidatos[0];
    return {
      dados: escolhido?.dados ?? null,
      nomeArquivo: escolhido?.arquivo?.nome_original ?? null,
    };
  }

  private async garantirAgendaMedidaFinaImportacao(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    params: {
      clienteId: number;
      nomeCliente: string;
      ambientesSelecionados?: string[];
    },
  ) {
    const statusDestino = 'AGENDAR_MEDIDA_FINA';
    const cliente = await tx.cliente.findUnique({
      where: { id: params.clienteId },
      select: { id: true, status: true },
    });
    if (!cliente) {
      return {
        agendaId: null as number | null,
        vendaId: null as number | null,
        alertas: ['Cliente não encontrado ao tentar encaminhar para agenda de medida fina.'],
      };
    }

    const venda = await tx.vendas.findFirst({
      where: { cliente_id: params.clienteId },
      orderBy: [{ data_venda: 'desc' }, { id: 'desc' }],
      select: { id: true, status: true },
    });

    const alertas: string[] = [];
    const statusClienteAtual = String(cliente.status || '').toUpperCase();
    if (
      statusClienteAtual !== statusDestino &&
      validarTransicaoStatusCliente({
        atual: statusClienteAtual,
        proximo: statusDestino,
      }).ok
    ) {
      await tx.cliente.update({
        where: { id: params.clienteId },
        data: { status: statusDestino },
      });
    }

    const statusVendaAtual = String(venda?.status || '').toUpperCase();
    if (
      venda?.id &&
      statusVendaAtual !== statusDestino &&
      validarTransicaoStatusCliente({
        atual: statusVendaAtual,
        proximo: statusDestino,
      }).ok
    ) {
      await tx.vendas.update({
        where: { id: venda.id },
        data: { status: statusDestino },
      });
    }

    const whereAgenda = venda?.id
      ? {
          venda_id: venda.id,
          categoria: { in: ['AGENDAR_MEDIDA_FINA'] },
          status: 'PENDENTE',
        }
      : {
          cliente_id: params.clienteId,
          categoria: { in: ['AGENDAR_MEDIDA_FINA'] },
          status: 'PENDENTE',
        };

    const agendaExistente = await tx.agenda_fabrica.findFirst({
      where: whereAgenda,
      select: { id: true },
    });
    if (agendaExistente) {
      return {
        agendaId: agendaExistente.id,
        vendaId: venda?.id ?? null,
        alertas,
      };
    }

    if (
      statusClienteAtual !== statusDestino &&
      !validarTransicaoStatusCliente({
        atual: statusClienteAtual,
        proximo: statusDestino,
      }).ok
    ) {
      alertas.push(
        `Cliente permaneceu em "${statusClienteAtual}" porque a transição automática para medida fina não é válida.`,
      );
      return {
        agendaId: null,
        vendaId: venda?.id ?? null,
        alertas,
      };
    }

    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
    const agenda = await this.agendaService.criarAgendaFabricaAutomatica(
      {
        titulo: venda?.id
          ? `Aguardando medida fina - Venda #${venda.id}`
          : `Aguardando medida fina - ${params.nomeCliente}`,
        inicio_em: inicio,
        fim_em: fim,
        subetapa: 'MEDIDA_FINA',
        origem_fluxo: 'IMPORTACAO_LEITURA',
        status: 'PENDENTE',
        venda_id: venda?.id ?? null,
        cliente_id: params.clienteId,
        ambientes_selecionados:
          Array.isArray(params.ambientesSelecionados) &&
          params.ambientesSelecionados.length
            ? params.ambientesSelecionados
            : undefined,
      },
      tx,
    );

    return {
      agendaId: Number(agenda?.id || 0) || null,
      vendaId: venda?.id ?? null,
      alertas,
    };
  }

  async listar(params: {
    owner_type?: string;
    owner_id?: any;
    categoria?: string;
    page?: number;
    pageSize?: number;
  }) {
    const owner_type_raw = this.normUpper(params.owner_type);
    const owner_id_raw = String(params.owner_id ?? '').replace(/\D/g, '');

    // se não vier filtro, retorna vazio (sem quebrar tela)
    if (!owner_type_raw || !owner_id_raw)
      return {
        data: [],
        meta: { page: 1, pageSize: 0, total: 0, totalPages: 0 },
      };

    const owner_type = this.ownerType(owner_type_raw);
    const owner_id = this.ownerId(owner_id_raw);
    const categoria = this.normUpper(params.categoria);

    const where: any = { owner_type, owner_id };
    if (categoria) where.categoria = categoria;
    if (owner_type === 'CONTRATO' && !categoria) {
      where.NOT = { categoria: 'RELATORIO_INTERNO' };
    }

    if (!params.page) {
      const rows = await this.prisma.arquivos.findMany({
        where,
        orderBy: { criado_em: 'desc' },
      });
      return rows.map((row) => this.normalizarArquivo(row));
    }

    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(1, Number(params.pageSize || 20));

    const total = await this.prisma.arquivos.count({ where });
    const data = await this.prisma.arquivos.findMany({
      where,
      orderBy: { criado_em: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: data.map((row) => this.normalizarArquivo(row)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async remover(id: number) {
    const cleanId = Number(id);
    if (!cleanId) throw new BadRequestException('ID inválido.');

    const arquivo = await this.prisma.arquivos.findUnique({
      where: { id: cleanId },
    });
    if (!arquivo) throw new NotFoundException('Arquivo não encontrado.');

    // ✅ se for imagem principal do produto, limpa o "atalho"
    if (
      arquivo.owner_type === 'PRODUTO' &&
      arquivo.slot_key === 'IMAGEM_PRINCIPAL'
    ) {
      try {
        await this.prisma.produtos.update({
          where: { id: arquivo.owner_id },
          data: { imagem_url: null },
        });
      } catch {}
    }

    // tenta apagar o arquivo físico (best effort)
    try {
      const resolvido = this.resolveArquivoFisico(arquivo);
      if (resolvido?.abs && fs.existsSync(resolvido.abs)) {
        fs.unlinkSync(resolvido.abs);
      }
    } catch {}

    await this.prisma.arquivos.delete({ where: { id: cleanId } });
    return { ok: true };
  }

  async salvarUpload(params: {
    owner_type: string;
    owner_id: number;
    categoria?: string | null;
    slot_key?: string | null;
    file: Express.Multer.File;
  }) {
    const owner_type = this.ownerType(params.owner_type);
    const owner_id = this.ownerId(params.owner_id);
    const categoria = this.normUpper(params.categoria);
    const slot_key = this.normUpper(params.slot_key);

    const folder = this.folderFromOwnerType(owner_type);
    const url = `/uploads/${folder}/${params.file.filename}`;

    // ✅ Se slot_key foi informado -> upsert (substitui)
    if (slot_key) {
      const existente = await this.prisma.arquivos.findUnique({
        where: {
          owner_type_owner_id_slot_key: { owner_type, owner_id, slot_key },
        },
      });

      const salvo = await this.prisma.arquivos.upsert({
        where: {
          owner_type_owner_id_slot_key: { owner_type, owner_id, slot_key },
        },
        create: {
          owner_type,
          owner_id,
          categoria,
          slot_key,
          url,
          filename: params.file.filename,
          nome: params.file.originalname,
          mime_type: params.file.mimetype,
          tamanho: params.file.size,
        },
        update: {
          categoria,
          url,
          filename: params.file.filename,
          nome: params.file.originalname,
          mime_type: params.file.mimetype,
          tamanho: params.file.size,
        },
      });

      // apaga arquivo antigo (best effort)
      if (existente?.url && existente.url !== salvo.url) {
        try {
          const relOld = existente.url.replace(/^\//, '');
          const absOld = path.join(process.cwd(), relOld);
          if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
        } catch {}
      }

      // ✅ espelha no produto para o index usar
      if (owner_type === 'PRODUTO' && slot_key === 'IMAGEM_PRINCIPAL') {
        await this.prisma.produtos.update({
          where: { id: owner_id },
          data: { imagem_url: url },
        });
      }

      if (
        owner_type === 'CLIENTE' &&
        this.isExtractable(salvo) &&
        ['CONTRATO', 'PROJETO_TECNICO', 'PROJETO', 'ORCAMENTO', 'DOCUMENTO'].includes(
          this.categoriaEfetiva(salvo),
        )
      ) {
        await this.preAquecerConsolidacaoCliente(owner_id);
      }

      return salvo;
    }

    // ✅ slot_key null -> cria múltiplos
    const salvo = await this.prisma.arquivos.create({
      data: {
        owner_type,
        owner_id,
        categoria,
        slot_key: null,
        url,
        filename: params.file.filename,
        nome: params.file.originalname,
        mime_type: params.file.mimetype,
        tamanho: params.file.size,
      },
    });

    if (
      owner_type === 'CLIENTE' &&
      this.isExtractable(salvo) &&
      ['CONTRATO', 'PROJETO_TECNICO', 'PROJETO', 'ORCAMENTO', 'DOCUMENTO'].includes(
        this.categoriaEfetiva(salvo),
      )
    ) {
      await this.preAquecerConsolidacaoCliente(owner_id);
    }

    return salvo;
  }

  async buscarPorId(id: number) {
    const arq = await this.prisma.arquivos.findUnique({ where: { id } });
    if (!arq) throw new NotFoundException('Arquivo não encontrado.');
    return this.normalizarArquivo(arq);
  }

  async resolverArquivoFisicoPorId(id: number) {
    const arquivo = await this.buscarPorId(id);
    return {
      arquivo,
      resolvido: this.resolveArquivoFisico(arquivo),
    };
  }

  /** Quando categoria vier vazia (upload manual), tenta classificar pelo nome do arquivo. */
  private categoriaEfetiva(arq: {
    categoria?: string | null;
    nome?: string | null;
    filename: string;
  }): string {
    const raw = String(arq.categoria || '').trim().toUpperCase();
    if (raw && raw !== 'DOCUMENTO') return raw;
    const n = (arq.nome || arq.filename || '').toLowerCase();
    if (/contrato/.test(n)) return 'CONTRATO';
    if (
      /proposta|or[cç]amento|orcamento|valido\s+vocês|orc\./.test(n)
    )
      return 'ORCAMENTO';
    if (
      /projeto\s*t[eé]cnico|projeto\s*atualizado|plano\s*(de\s*)?corte/.test(
        n,
      )
    )
      return 'PROJETO_TECNICO';
    if (/\bprojeto\b/.test(n)) return 'PROJETO';
    return raw || 'DOCUMENTO';
  }

  private nomeBaseArquivo(nome: string): string {
    return String(nome || '')
      .replace(/\.(pdf|docx?)$/i, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private isExtractable(arq: {
    mime_type?: string | null;
    filename?: string;
    nome?: string | null;
  }): boolean {
    const mime = (arq.mime_type || '').toLowerCase();
    const n = (arq.nome || arq.filename || '').toLowerCase();
    if (mime === 'application/pdf') return true;
    if (mime.includes('wordprocessingml') || mime === 'application/msword')
      return true;
    if (n.endsWith('.docx') || n.endsWith('.doc')) return true;
    return false;
  }

  private pickLatestFileGroup<
    T extends {
      nome: string | null;
      filename: string;
      mime_type?: string | null;
      criado_em: Date;
    },
  >(arquivos: T[]): T[] {
    const ex = arquivos.filter((a) => this.isExtractable(a));
    if (!ex.length) return [];
    const sorted = [...ex].sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    );
    const top = sorted[0];
    const base = this.nomeBaseArquivo(top.nome || top.filename || '');
    return sorted.filter(
      (a) => this.nomeBaseArquivo(a.nome || a.filename || '') === base,
    );
  }

  private agruparPorNomeBase<
    T extends { nome: string | null; filename: string },
  >(arquivos: T[]): Map<string, T[]> {
    const mapa = new Map<string, T[]>();
    for (const arq of arquivos) {
      const chave = this.nomeBaseArquivo(arq.nome || arq.filename || '');
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(arq);
    }
    return mapa;
  }

  private async arquivoRowParaMulter(arquivo: {
    id: number;
    nome: string | null;
    filename: string;
    mime_type: string | null;
  }): Promise<Express.Multer.File | null> {
    const { resolvido } = await this.resolverArquivoFisicoPorId(arquivo.id);
    if (!resolvido?.abs || !fs.existsSync(resolvido.abs)) return null;
    const buffer = fs.readFileSync(resolvido.abs);
    return {
      fieldname: 'files',
      originalname: arquivo.nome || arquivo.filename,
      encoding: '7bit',
      mimetype: arquivo.mime_type || 'application/octet-stream',
      buffer,
      size: buffer.length,
      destination: '',
      filename: arquivo.filename,
      path: '',
      stream: undefined as any,
    } as Express.Multer.File;
  }

  /** Trecho “Observações gerais” comum em propostas/orçamentos. */
  private extrairObservacoesGerais(texto: string): string | null {
    if (!texto?.trim()) return null;
    const t = texto.replace(/\r\n/g, '\n');
    const re =
      /(?:^|\n)\s*observa[çc][õo]es\s+gerais\s*[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Cliente\s*:|Item\s*\/|Proposta|Total|R\$\s*[0-9]|Data\s*:|Prazo\s+de\s+Entrega)|$)/i;
    const m = t.match(re);
    return m?.[1] ? m[1].trim().slice(0, 12000) : null;
  }

  /** Bloco item/ambiente + descritivo (texto técnico para produção). */
  private extrairDescritivoItens(texto: string): string | null {
    if (!texto?.trim()) return null;
    const re =
      /(?:item\s*\/\s*ambiente|item\s*\/\s*ambientes)\s*[:\s]*([\s\S]*?)(?=\n\s*(?:Data\s*:|Total\s*:|Proposta\s+\d+|R\$\s*[0-9][0-9\.\s]*,[0-9]{2}\s*$)|\nTotal\s*:)/i;
    const m = texto.replace(/\r\n/g, '\n').match(re);
    return m?.[1] ? m[1].trim().slice(0, 20000) : null;
  }

  private async rowsParaMulter(
    arquivos: {
      id: number;
      nome: string | null;
      filename: string;
      mime_type: string | null;
    }[],
  ): Promise<Express.Multer.File[]> {
    const out: Express.Multer.File[] = [];
    for (const arq of arquivos) {
      const m = await this.arquivoRowParaMulter(arq);
      if (m) out.push(m);
    }
    return out;
  }

  /**
   * Lista todas as versões de orçamento do cliente, agrupadas por nome base.
   * Para cada grupo extrai valor total e ambientes com valor individual.
   */
  async listarOrcamentosCliente(clienteId: number) {
    if (!clienteId || clienteId <= 0) {
      throw new BadRequestException('clienteId inválido.');
    }
    const cliente = await this.prisma.cliente.findFirst({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    const todos = await this.prisma.arquivos.findMany({
      where: { owner_type: 'CLIENTE', owner_id: clienteId },
      orderBy: { criado_em: 'desc' },
    });

    const orcRows = todos.filter((a) => this.categoriaEfetiva(a) === 'ORCAMENTO');
    const grupos = this.agruparPorNomeBase(orcRows);

    const versoes: Array<{
      versao_key: string;
      versao_label: string;
      arquivos: Array<{ id: number; nome: string; mime_type: string | null; criado_em: Date }>;
      valor_total: number | null;
      ambientes: Array<{ nome: string; valor: number }>;
      criado_em: Date;
      is_mais_recente: boolean;
    }> = [];

    for (const [key, rows] of grupos) {
      const sortedRows = [...rows].sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
      );
      const extractable = sortedRows.filter((a) => this.isExtractable(a));
      let valor_total: number | null = null;
      let ambientes: Array<{ nome: string; valor: number }> = [];

      if (extractable.length) {
        try {
          const multer = await this.rowsParaMulter(extractable);
          if (multer.length) {
            const r = await this.extractionService.extrairDosArquivos(multer);
            valor_total = r.consolidado.valorTotal ?? null;
            ambientes = r.consolidado.ambientes_com_valor ?? [];
            // Fallback: se não encontrou ambientes com valor, usa lista simples
            if (!ambientes.length && r.consolidado.ambientes?.length) {
              ambientes = r.consolidado.ambientes.map((n) => ({ nome: n, valor: 0 }));
            }
          }
        } catch {
          // ignora erro de extração por grupo
        }
      }

      versoes.push({
        versao_key: key,
        versao_label: sortedRows[0]?.nome || sortedRows[0]?.filename || key,
        arquivos: sortedRows.map((r) => ({
          id: r.id,
          nome: r.nome || r.filename,
          mime_type: r.mime_type,
          criado_em: r.criado_em,
        })),
        valor_total,
        ambientes,
        criado_em: sortedRows[0]?.criado_em ?? new Date(0),
        is_mais_recente: false,
      });
    }

    // Marca a versão mais recente
    versoes.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    if (versoes.length) versoes[0].is_mais_recente = true;

    return {
      cliente_id: clienteId,
      nome_cliente: cliente.nome_completo ?? cliente.razao_social ?? `Cliente #${clienteId}`,
      total_versoes: versoes.length,
      versoes,
    };
  }

  /**
   * Lê PDF/DOCX do cliente (categorias do Drive) e devolve visão separada:
   * financeiro apenas de CONTRATO; produção do PROJETO_TECNICO / PROJETO / ORÇAMENTO mais recente.
   * Se orcamentoArquivoIds for passado, usa esses arquivos específicos para produção.
   */
  async consolidacaoCliente(
    clienteId: number,
    opts?: { orcamentoArquivoIds?: number[]; ignorarCache?: boolean },
  ) {
    if (!clienteId || clienteId <= 0) {
      throw new BadRequestException('clienteId inválido.');
    }

    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    const todos = await this.prisma.arquivos.findMany({
      where: { owner_type: 'CLIENTE', owner_id: clienteId },
      orderBy: { criado_em: 'desc' },
    });

    const assinaturaArquivos = this.assinaturaConsolidacaoCliente(
      todos,
      opts?.orcamentoArquivoIds,
    );
    if (!opts?.ignorarCache) {
      const snapshot = await this.buscarSnapshotConsolidacaoCliente(
        clienteId,
        assinaturaArquivos,
      );
      if (snapshot) return snapshot;
    }

    const porCat = new Map<string, typeof todos>();
    for (const a of todos) {
      const cat = this.categoriaEfetiva(a);
      if (!porCat.has(cat)) porCat.set(cat, []);
      porCat.get(cat)!.push(a);
    }

    const alertas: string[] = [];
    const arquivos_processados: Array<{
      id: number;
      nome: string;
      categoria: string | null;
      papel: 'FINANCEIRO' | 'PRODUCAO';
      erro?: string;
    }> = [];

    const contratoRows = porCat.get('CONTRATO') || [];
    const multerContrato = await this.rowsParaMulter(
      contratoRows.filter((a) => this.isExtractable(a)),
    );

    let dadosContrato: import('../extraction/extraction.service').DadosExtraidos | null =
      null;
    if (multerContrato.length) {
      try {
        const r = await this.extractionService.extrairDosArquivos(multerContrato);
        const financeiroOficial = this.escolherDocumentoFinanceiroOficial(r.arquivos);
        dadosContrato = financeiroOficial.dados ?? r.consolidado;
        if (financeiroOficial.nomeArquivo && contratoRows.length > 1) {
          alertas.push(
            `Financeiro oficial do cliente definido a partir de "${financeiroOficial.nomeArquivo}" para manter valor bruto e parcelas na mesma fonte.`,
          );
        }
        for (const arq of r.arquivos) {
          const row = contratoRows.find(
            (x) => (x.nome || x.filename) === arq.nome_original,
          );
          arquivos_processados.push({
            id: row?.id ?? 0,
            nome: arq.nome_original,
            categoria: 'CONTRATO',
            papel: 'FINANCEIRO',
            erro: arq.erro || undefined,
          });
        }
      } catch (e: any) {
        alertas.push(`Erro ao ler contrato(s): ${e?.message || e}`);
      }
    } else {
      alertas.push(
        'Nenhum PDF/DOCX na categoria CONTRATO — financeiro oficial (valores/parcelas) não pôde ser extraído.',
      );
    }

    let catProducao: string | null = null;
    let rowsProducao: typeof todos = [];

    // Se foram passados IDs específicos de orçamento (vindos da tela de orçamentos), usa eles
    const orcIds = opts?.orcamentoArquivoIds;
    if (orcIds?.length) {
      const selecionados = todos.filter((a) => orcIds.includes(a.id) && this.isExtractable(a));
      if (selecionados.length) {
        catProducao = 'ORCAMENTO';
        rowsProducao = selecionados;
      }
    }

    // Fallback: busca automática pelo grupo mais recente
    if (!rowsProducao.length) {
      for (const cat of ['PROJETO_TECNICO', 'PROJETO', 'ORCAMENTO'] as const) {
        const list = porCat.get(cat) || [];
        const grp = this.pickLatestFileGroup(list);
        if (grp.length) {
          catProducao = cat;
          rowsProducao = grp;
          break;
        }
      }
    }

    let dadosProducao: import('../extraction/extraction.service').DadosExtraidos | null =
      null;
    if (rowsProducao.length) {
      const multerP = await this.rowsParaMulter(rowsProducao);
      if (multerP.length) {
        try {
          const r = await this.extractionService.extrairDosArquivos(multerP);
          dadosProducao = r.consolidado;
          for (const arq of r.arquivos) {
            const row = rowsProducao.find(
              (x) => (x.nome || x.filename) === arq.nome_original,
            );
            arquivos_processados.push({
              id: row?.id ?? 0,
              nome: arq.nome_original,
              categoria: catProducao,
              papel: 'PRODUCAO',
              erro: arq.erro || undefined,
            });
          }
        } catch (e: any) {
          alertas.push(`Erro ao ler documento de produção: ${e?.message || e}`);
        }
      }
    } else {
      alertas.push(
        'Nenhum arquivo em PROJETO_TÉCNICO, PROJETO ou ORÇAMENTO para montar o detalhamento de produção.',
      );
    }

    const valorContrato = dadosContrato?.valorTotal ?? null;
    const orcRows = porCat.get('ORCAMENTO') || [];
    const gruposOrc = this.agruparPorNomeBase(orcRows);
    for (const [, rows] of gruposOrc) {
      const multerO = await this.rowsParaMulter(
        rows.filter((a) => this.isExtractable(a)),
      );
      if (!multerO.length) continue;
      try {
        const r = await this.extractionService.extrairDosArquivos(multerO);
        const v = r.consolidado.valorTotal;
        if (
          valorContrato != null &&
          v != null &&
          Math.abs(Number(valorContrato) - Number(v)) > 0.02
        ) {
          const nomeRef = rows[0]?.nome || rows[0]?.filename || 'orçamento';
          alertas.push(
            `Valor do contrato (R$ ${Number(valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) difere de "${nomeRef}" (R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Manter o contrato como oficial no financeiro.`,
          );
        }
      } catch {
        /* ignore por grupo */
      }
    }

    const resultado = {
      cliente_id: clienteId,
      financeiro: {
        fonte: 'CONTRATO',
        valor_total: valorContrato,
        parcelas: dadosContrato?.parcelas ?? [],
        data_fechamento: dadosContrato?.dataFechamento ?? null,
        data_entrega_prevista: dadosContrato?.dataEntrega ?? null,
        nome_cliente:
          dadosContrato?.nomeCliente ??
          cliente.nome_completo ??
          cliente.razao_social ??
          null,
        cpf_cnpj: dadosContrato?.cpfCnpj ?? null,
        endereco_cliente: dadosContrato?.endereco_cliente ?? null,
        endereco_obra_entrega: dadosContrato?.endereco_entrega ?? null,
        telefone:
          dadosContrato?.telefone ??
          cliente.telefone ??
          cliente.whatsapp ??
          null,
        contato_nome: dadosContrato?.contato_nome ?? null,
      },
      producao: dadosProducao
        ? {
            fonte_categoria: catProducao,
            arquivos: rowsProducao.map((r) => ({
              id: r.id,
              nome: r.nome || r.filename,
            })),
            ambientes: dadosProducao.ambientes ?? [],
            ambientes_com_valor: dadosProducao.ambientes_com_valor ?? [],
            // Fallback: se o arquivo de produção não encontrou ambientes, tenta os do contrato
            ambientes_fallback_contrato: dadosContrato?.ambientes ?? [],
            observacoes_gerais: this.extrairObservacoesGerais(
              dadosProducao.texto_bruto || '',
            ),
            descritivo_itens_ambientes: this.extrairDescritivoItens(
              dadosProducao.texto_bruto || '',
            ),
            texto_trecho: (dadosProducao.texto_bruto || '').slice(0, 32000),
          }
        : {
            fonte_categoria: 'CONTRATO',
            arquivos: [],
            ambientes: dadosContrato?.ambientes ?? [],
            ambientes_com_valor: dadosContrato?.ambientes_com_valor ?? [],
            ambientes_fallback_contrato: [],
            observacoes_gerais: null,
            descritivo_itens_ambientes: null,
            texto_trecho: '',
          },
      alertas,
      arquivos_processados,
    };

    await this.salvarSnapshotConsolidacaoCliente(
      clienteId,
      assinaturaArquivos,
      resultado,
    );

    return resultado;
  }

  private parseDataEntregaImportacao(input?: string | null): Date {
    const raw = String(input || '').trim();
    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) return d;
    }
    // Fallback: 30 dias a partir de hoje
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 30);
    return hoje;
  }

  private normFormaRecebimento(
    forma: string | undefined | null,
  ): string | undefined {
    const f = String(forma || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    const allowed = new Set([
      'PIX',
      'CHEQUE',
      'CARTAO',
      'BOLETO',
      'TRANSFERENCIA',
      'DINHEIRO',
      'OUTROS',
    ]);
    if (!f) return undefined;
    if (allowed.has(f)) return f;
    return 'OUTROS';
  }

  private erroSchemaLegadoOrdemServico(error: any): boolean {
    const msg = String(error?.message || '');
    const codigoPrisma = String(error?.code || '');
    const citaCampoNovo =
      msg.includes('valor_taxas_processamento_cartao') ||
      msg.includes('valor_taxas_antecipacao_credito');
    const indicaSchemaIncompativel =
      /Unknown field|Unknown argument|Unknown column|does not exist in the current database/i.test(
        msg,
      );
    const colunaAusentePrisma = codigoPrisma === 'P2022';
    return citaCampoNovo && (indicaSchemaIncompativel || colunaAusentePrisma);
  }

  private async listarColunasTabela(
    runner: { $queryRawUnsafe: (...args: any[]) => Promise<any> },
    tabela: string,
  ): Promise<Set<string>> {
    const rows = (await runner.$queryRawUnsafe(
      `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?`,
      tabela,
    )) as Array<{ COLUMN_NAME?: string }>;
    return new Set(
      (rows || [])
        .map((row) => String(row?.COLUMN_NAME || '').trim())
        .filter(Boolean),
    );
  }

  private async buscarMarkupSalvoClienteLegadoRaw(clienteId: number) {
    const colunas = await this.listarColunasTabela(this.prisma, 'ordem_servico');
    if (!colunas.has('id')) return null;

    const camposDesejados = [
      'id',
      'criado_em',
      'valor_bruto',
      'valor_impostos_nf',
      'valor_comissao',
      'valor_taxas_cartao',
      'valor_taxas_processamento_cartao',
      'valor_taxas_antecipacao_credito',
      'valor_liquido',
      'taxa_nota_percentual',
      'tem_nota_fiscal',
      'comissionados',
    ].filter((campo) => colunas.has(campo));

    const orderBy = colunas.has('criado_em') ? 'criado_em DESC' : 'id DESC';
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT ${camposDesejados.join(', ')}
         FROM ordem_servico
        WHERE cliente_id = ?
          AND origem = 'IMPORTACAO_LEITURA'
        ORDER BY ${orderBy}
        LIMIT 1`,
      clienteId,
    );
    const os = rows?.[0];
    if (!os) return null;

    return {
      ...os,
      valor_taxas_processamento_cartao: colunas.has('valor_taxas_processamento_cartao')
        ? os.valor_taxas_processamento_cartao ?? null
        : null,
      valor_taxas_antecipacao_credito: colunas.has('valor_taxas_antecipacao_credito')
        ? os.valor_taxas_antecipacao_credito ?? null
        : null,
    };
  }

  private async criarOrdemServicoLegadoRaw(
    tx: {
      $executeRawUnsafe: (...args: any[]) => Promise<any>;
      $queryRawUnsafe: (...args: any[]) => Promise<any>;
    },
    payload: {
      cliente_id: number;
      data_entrega_prevista: Date;
      origem: string;
      observacao: string | null;
      valor_bruto: number | null | undefined;
      valor_impostos_nf: number | null | undefined;
      valor_comissao: number | null | undefined;
      valor_taxas_cartao: number | null | undefined;
      valor_taxas_processamento_cartao?: number | null | undefined;
      valor_taxas_antecipacao_credito?: number | null | undefined;
      valor_liquido: number | null | undefined;
      taxa_nota_percentual: number | null | undefined;
      tem_nota_fiscal: boolean;
      comissionados: any;
    },
  ) {
    const colunas = await this.listarColunasTabela(tx, 'ordem_servico');
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    const add = (coluna: string, valor: any) => {
      if (!colunas.has(coluna)) return;
      columns.push(coluna);
      placeholders.push('?');
      values.push(valor);
    };

    add('cliente_id', payload.cliente_id);
    add('data_entrega_prevista', payload.data_entrega_prevista);
    add('origem', payload.origem);
    add('observacao', payload.observacao);
    add('valor_bruto', payload.valor_bruto ?? null);
    add('valor_impostos_nf', payload.valor_impostos_nf ?? null);
    add('valor_comissao', payload.valor_comissao ?? null);
    add('valor_taxas_cartao', payload.valor_taxas_cartao ?? null);
    add(
      'valor_taxas_processamento_cartao',
      payload.valor_taxas_processamento_cartao ?? null,
    );
    add(
      'valor_taxas_antecipacao_credito',
      payload.valor_taxas_antecipacao_credito ?? null,
    );
    add('valor_liquido', payload.valor_liquido ?? null);
    add('taxa_nota_percentual', payload.taxa_nota_percentual ?? null);
    add('tem_nota_fiscal', payload.tem_nota_fiscal ? 1 : 0);
    add('comissionados', JSON.stringify(payload.comissionados ?? null));

    const agora = new Date();
    add('criado_em', agora);
    add('atualizado_em', agora);

    if (!columns.length) {
      throw new BadRequestException(
        'Tabela ordem_servico incompatível com o modo legado de gravação.',
      );
    }

    await tx.$executeRawUnsafe(
      `INSERT INTO ordem_servico (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})`,
      ...values,
    );
    const inserted = (await tx.$queryRawUnsafe(
      'SELECT LAST_INSERT_ID() AS id',
    )) as Array<{ id: bigint | number }>;
    const osId = Number(inserted?.[0]?.id ?? 0);
    if (!osId) {
      throw new BadRequestException(
        'Não foi possível obter o ID da ordem de serviço após a gravação legada.',
      );
    }
    return {
      id: osId,
      data_entrega_prevista: payload.data_entrega_prevista,
    };
  }

  /**
   * Retorna os campos de markup da última ordem de serviço gerada por importação
   * para o cliente, ou null se não existir nenhuma.
   */
  async markupSalvoCliente(clienteId: number) {
    const ehMarkupPersistido = (payload: any) =>
      !!(
        payload &&
        typeof payload === 'object' &&
        (payload.schema === 'MARKUP_V2' || payload.papeis || payload.parcelas_markup)
      );

    const normalizarRetornoMarkup = (os: any) => {
      const payload = os?.comissionados;
      const ehEnvelope = ehMarkupPersistido(payload);
      const papeis = ehEnvelope ? payload?.papeis || {} : payload || {};
      const parcelasMarkup = ehEnvelope
        ? Array.isArray(payload?.parcelas_markup)
          ? payload.parcelas_markup
          : []
        : [];
      return {
        ...os,
        comissionados: papeis,
        parcelas_markup: parcelasMarkup,
      };
    };

    try {
      const rows = await this.prisma.ordem_servico.findMany({
        where: { cliente_id: clienteId, origem: 'IMPORTACAO_LEITURA' },
        orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          criado_em: true,
          valor_bruto: true,
          valor_impostos_nf: true,
          valor_comissao: true,
          valor_taxas_cartao: true,
          valor_taxas_processamento_cartao: true,
          valor_taxas_antecipacao_credito: true,
          valor_liquido: true,
          taxa_nota_percentual: true,
          tem_nota_fiscal: true,
          comissionados: true,
        },
        take: 10,
      });
      const os = (rows as any[]).find((row) => ehMarkupPersistido(row?.comissionados));
      return os ? normalizarRetornoMarkup(os) : null;
    } catch (error) {
      if (!this.erroSchemaLegadoOrdemServico(error)) throw error;
      const osLegado = await this.buscarMarkupSalvoClienteLegadoRaw(clienteId);

      return osLegado && ehMarkupPersistido(osLegado?.comissionados)
        ? normalizarRetornoMarkup({
            ...osLegado,
            valor_taxas_processamento_cartao: null,
            valor_taxas_antecipacao_credito: null,
          })
        : null;
    }
  }

  /**
   * Persiste o resultado da leitura: contas a receber (parcelas do contrato),
   * ordem de serviço com data de entrega e uma linha em producao_etapas por ambiente.
   */
  async confirmarImportacaoLeitura(
    clienteId: number,
    opts?: {
      data_entrega_prevista?: string | null;
      valor_bruto?: number;
      valor_impostos_nf?: number;
      valor_comissao?: number;
      valor_taxas_cartao?: number;
      valor_taxas_processamento_cartao?: number;
      valor_taxas_antecipacao_credito?: number;
      valor_liquido?: number;
      taxa_nota_percentual?: number;
      tem_nota_fiscal?: boolean;
      comissionados?: Record<string, { nome: string; percentual: number }>;
      parcelas?: Array<{
        valor: number;
        vencimento?: string | null;
        forma?: string | null;
        descricao?: string | null;
      }>;
    },
  ) {
    if (!clienteId || clienteId <= 0) {
      throw new BadRequestException('clienteId inválido.');
    }

    this.logger.log(
      `confirmarImportacaoLeitura clienteId=${clienteId} opts=${JSON.stringify(opts)}`,
    );

    const consolidated = await this.consolidacaoCliente(clienteId);
    const nomeCliente =
      consolidated.financeiro.nome_cliente || `Cliente #${clienteId}`;
    const parcelas =
      Array.isArray(opts?.parcelas) && opts.parcelas.length
        ? opts.parcelas
        : consolidated.financeiro.parcelas ?? [];
    const valorTotalContrato =
      consolidated.financeiro.valor_total != null
        ? Number(consolidated.financeiro.valor_total)
        : 0;
    const valorBrutoVenda = Number(opts?.valor_bruto ?? NaN);
    const valorLiquidoMarkup = Number(opts?.valor_liquido ?? NaN);
    const valorTotalReceber =
      Number.isFinite(valorBrutoVenda) && valorBrutoVenda > 0
        ? valorBrutoVenda
        : valorTotalContrato;

    const ambientesNomes = new Set<string>();
    const prod = consolidated.producao;
    if (prod?.ambientes?.length) {
      for (const a of prod.ambientes) {
        const n = String(a || '').trim();
        if (n) ambientesNomes.add(n);
      }
    }
    if (prod?.ambientes_com_valor?.length) {
      for (const x of prod.ambientes_com_valor) {
        const n = String(x?.nome || '').trim();
        if (n) ambientesNomes.add(n);
      }
    }
    // Fallback: se nenhum ambiente foi encontrado nos docs de produção, usa o fallback do contrato
    if (ambientesNomes.size === 0 && (prod as any)?.ambientes_fallback_contrato?.length) {
      for (const a of (prod as any).ambientes_fallback_contrato) {
        const n = String(a || '').trim();
        if (n) ambientesNomes.add(n);
      }
    }
    const listaAmbientes = [...ambientesNomes];
    const ambientesMedidaFina: string[] = Array.from(
      new Set(
        (
          Array.isArray((prod as any)?.ambientes_fallback_contrato)
            ? (prod as any).ambientes_fallback_contrato
            : prod?.fonte_categoria === 'CONTRATO' && Array.isArray(prod?.ambientes)
              ? prod.ambientes
              : listaAmbientes
        )
          .map((a: any) => String(a || '').trim())
          .filter(Boolean),
      ),
    );

    const dataEntrega = this.parseDataEntregaImportacao(
      opts?.data_entrega_prevista,
    );
    const alertas: string[] = [...(consolidated.alertas || [])];
    if (
      Number.isFinite(valorBrutoVenda) &&
      valorBrutoVenda > 0 &&
      valorTotalContrato > 0 &&
      Math.abs(valorBrutoVenda - valorTotalContrato) > valorTotalContrato * 0.02
    ) {
      alertas.push(
        `Contas a receber serão geradas pelo valor de venda do markup (${valorBrutoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}), não pelo valor lido do contrato.`,
      );
    }
    if (Array.isArray(opts?.parcelas) && opts.parcelas.length) {
      alertas.push('Parcelas do Contas a Receber aplicadas a partir do markup salvo.');
    }

    const formaLabel: Record<string, string> = {
      PIX: 'PIX',
      CHEQUE: 'Cheque',
      CARTAO: 'Cartão',
      BOLETO: 'Boleto',
      TRANSFERENCIA: 'Transferência',
      DINHEIRO: 'Dinheiro',
      OUTROS: 'Outros',
    };

    // ── Prepara dados das contas a receber ANTES da transação ──────────────────
    const round2 = (n: number) =>
      Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
    const parcelasLidas = parcelas.filter(
      (p: any) => p && typeof p === 'object',
    );
    const parcelasVieramMarkup =
      Array.isArray(opts?.parcelas) && opts.parcelas.length > 0;
    const quantidadeParcelas = parcelasLidas.length;
    const parcelasComValor = parcelasLidas.filter(
      (p: any) => Number(p?.valor || 0) > 0,
    );
    const somaParcelasOriginais = parcelasComValor.reduce(
      (s: number, p: any) => s + Number(p?.valor || 0),
      0,
    );
    const totalAlvoParcelamento =
      valorTotalReceber > 0 ? valorTotalReceber : somaParcelasOriginais;
    const antecipacaoAtiva = Number(opts?.valor_taxas_antecipacao_credito || 0) > 0;
    let parcelasAjustadas: any[] = [];
    if (quantidadeParcelas > 0 && totalAlvoParcelamento > 0) {
      if (parcelasVieramMarkup && parcelasComValor.length === quantidadeParcelas) {
        parcelasAjustadas = parcelasLidas.map((p: any) => ({
          ...p,
          valor: round2(Number(p?.valor || 0)),
        }));
      } else if (
        parcelasComValor.length === quantidadeParcelas &&
        somaParcelasOriginais > 0
      ) {
        const fator = totalAlvoParcelamento / somaParcelasOriginais;
        parcelasAjustadas = parcelasLidas.map((p: any) => ({
          ...p,
          valor: round2(Number(p?.valor || 0) * fator),
        }));
      } else {
        const valorBase = round2(totalAlvoParcelamento / quantidadeParcelas);
        parcelasAjustadas = parcelasLidas.map((p: any) => ({
          ...p,
          valor: valorBase,
        }));
        if (parcelasComValor.length !== quantidadeParcelas) {
          alertas.push(
            `Leitura das parcelas veio incompleta; distribuindo ${totalAlvoParcelamento.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })} em ${quantidadeParcelas} parcela(s).`,
          );
        }
      }

      const somaSemUltima = parcelasAjustadas
        .slice(0, -1)
        .reduce((s: number, p: any) => s + Number(p?.valor || 0), 0);
      const ultima = parcelasAjustadas[parcelasAjustadas.length - 1];
      parcelasAjustadas[parcelasAjustadas.length - 1] = {
        ...ultima,
        valor: round2(Math.max(totalAlvoParcelamento - somaSemUltima, 0)),
      };
    }
    const parcelasOriginaisMarkup = parcelasAjustadas.map((p: any, idx: number) => ({
      parcela: idx + 1,
      valor: Number(p?.valor || 0),
      vencimento: p?.vencimento ?? null,
      forma: p?.forma ?? null,
      descricao: p?.descricao ?? null,
    }));
    if (antecipacaoAtiva && parcelasAjustadas.length > 1) {
      const datasValidas = parcelasAjustadas
        .map((p: any) => {
          const d = p?.vencimento ? new Date(p.vencimento) : null;
          return d && !Number.isNaN(d.getTime()) ? d : null;
        })
        .filter(Boolean) as Date[];
      const vencimentoUnico = datasValidas.length
        ? new Date(Math.min(...datasValidas.map((d) => d.getTime())))
            .toISOString()
            .slice(0, 10)
        : consolidated.financeiro.data_fechamento ?? null;
      parcelasAjustadas = [
        {
          valor: round2(
            parcelasAjustadas.reduce((s: number, p: any) => s + Number(p?.valor || 0), 0),
          ),
          forma: 'CARTAO',
          vencimento: vencimentoUnico,
          descricao: `ANTECIPACAO_CARTAO ${parcelasAjustadas.length} parcela(s) consolidadas no markup`,
        },
      ];
      alertas.push(
        'Antecipação de crédito ativa no markup: Contas a Receber consolidado em parcela única.',
      );
    }
    const somaParcelasAjustadas = parcelasAjustadas.reduce(
      (s, p) => s + Number(p.valor),
      0,
    );
    const tolerancia = totalAlvoParcelamento > 0 ? totalAlvoParcelamento * 0.02 : 0;
    const parcelasCoerentes =
      parcelasAjustadas.length > 0 &&
      totalAlvoParcelamento > 0 &&
      Math.abs(somaParcelasAjustadas - totalAlvoParcelamento) <= tolerancia;

    if (
      parcelasAjustadas.length > 0 &&
      totalAlvoParcelamento > 0 &&
      !parcelasCoerentes
    ) {
      alertas.push(
        parcelasVieramMarkup
          ? 'Soma das parcelas do PDF difere do valor bruto do markup; o Contas a Receber manterá as parcelas revisadas do PDF para permitir a baixa correta.'
          : 'Soma das parcelas ajustadas difere do total do markup — gravando uma conta por parcela (mesmo assim).',
      );
    }

    type ContaInput = Record<string, any>;
    let contasData: ContaInput[] = [];

    if (parcelasAjustadas.length > 0) {
      contasData = parcelasAjustadas.map((p, i) => {
        const venc = p.vencimento ? new Date(p.vencimento) : null;
        return {
          cliente_id: clienteId,
          origem_tipo: 'IMPORTACAO_LEITURA',
          origem_id: 0, // substituído após criar a OS
          descricao: `${nomeCliente} — Parcela ${i + 1}/${parcelasAjustadas.length} (${formaLabel[p.forma] ?? p.forma})`,
          observacao: String(p.descricao || '').slice(0, 500),
          valor_original: p.valor,
          valor_compensado: 0,
          status: 'EM_ABERTO',
          forma_recebimento_chave: this.normFormaRecebimento(p.forma),
          vencimento_em: venc && !Number.isNaN(venc.getTime()) ? venc : null,
        } as ContaInput;
      });
    } else if (valorTotalReceber > 0) {
      const vencStr = consolidated.financeiro.data_fechamento;
      let venc: Date | null = null;
      if (vencStr) {
        const d = new Date(vencStr);
        venc = !Number.isNaN(d.getTime()) ? d : null;
      }
      contasData = [
        {
          cliente_id: clienteId,
          origem_tipo: 'IMPORTACAO_LEITURA',
          origem_id: 0,
          descricao: `${nomeCliente} — Importação leitura (valor total markup)`,
          observacao: 'Parcelas não disponíveis; valor único calculado pelo markup.',
          valor_original: valorTotalReceber,
          valor_compensado: 0,
          status: 'EM_ABERTO',
          vencimento_em: venc,
        } as ContaInput,
      ];
    } else {
      alertas.push(
        'Sem parcelas lidas e sem valor bruto válido — nenhuma conta a receber criada.',
      );
    }

    if (!listaAmbientes.length) {
      alertas.push(
        'Nenhum ambiente identificado na leitura — nenhuma linha em producao_etapas.',
      );
    }

    // ── Transação: só INSERTs rápidos, sem leitura de arquivo ──────────────────
    return this.prisma.$transaction(
      async (tx) => {
        // Regravação do markup de importação substitui a versão anterior do cliente,
        // para não empilhar múltiplas linhas iguais em Contas a Receber.
        await tx.contas_receber.deleteMany({
          where: {
            cliente_id: clienteId,
            origem_tipo: 'IMPORTACAO_LEITURA',
          },
        });
        await tx.ordem_servico.deleteMany({
          where: {
            cliente_id: clienteId,
            origem: 'IMPORTACAO_LEITURA',
          },
        });
        await tx.agenda_fabrica.deleteMany({
          where: {
            cliente_id: clienteId,
            origem_fluxo: 'IMPORTACAO_LEITURA',
            status: 'PENDENTE',
          },
        });

        const snapshotMarkup = {
          schema: 'MARKUP_V2',
          papeis: opts?.comissionados
            ? JSON.parse(JSON.stringify(opts.comissionados))
            : {},
          parcelas_markup: parcelasAjustadas.map((p: any, idx: number) => ({
            parcela: idx + 1,
            valor: Number(p?.valor || 0),
            vencimento: p?.vencimento ?? null,
            forma: p?.forma ?? null,
            descricao: p?.descricao ?? null,
          })),
          parcelas_originais_markup: parcelasOriginaisMarkup,
          total_markup: Number(valorTotalReceber || 0),
          valor_liquido: Number.isFinite(valorLiquidoMarkup)
            ? Number(valorLiquidoMarkup)
            : null,
          gerado_em: new Date().toISOString(),
        };

        const osDataBase = {
          cliente_id: clienteId,
          data_entrega_prevista: dataEntrega,
          origem: 'IMPORTACAO_LEITURA',
          observacao: `Gerado pela confirmação de leitura de documentos (${nomeCliente})`,
          valor_bruto: opts?.valor_bruto ?? null,
          valor_impostos_nf: opts?.valor_impostos_nf ?? null,
          valor_comissao: opts?.valor_comissao ?? null,
          valor_taxas_cartao: opts?.valor_taxas_cartao ?? null,
          valor_liquido: opts?.valor_liquido ?? null,
          taxa_nota_percentual: opts?.taxa_nota_percentual ?? null,
          tem_nota_fiscal: opts?.tem_nota_fiscal ?? true,
          comissionados: snapshotMarkup as any,
        };

        let os: any;
        try {
          os = await tx.ordem_servico.create({
            data: {
              ...osDataBase,
              valor_taxas_processamento_cartao:
                opts?.valor_taxas_processamento_cartao ?? null,
              valor_taxas_antecipacao_credito:
                opts?.valor_taxas_antecipacao_credito ?? null,
            } as any,
          });
        } catch (error) {
          if (!this.erroSchemaLegadoOrdemServico(error)) throw error;
          os = await this.criarOrdemServicoLegadoRaw(tx, {
            ...osDataBase,
            valor_taxas_processamento_cartao:
              opts?.valor_taxas_processamento_cartao ?? null,
            valor_taxas_antecipacao_credito:
              opts?.valor_taxas_antecipacao_credito ?? null,
          });
        }

        // Injeta o ID da OS e cria todas as contas em batch
        const contasIds: number[] = [];
        if (contasData.length) {
          for (const conta of contasData) {
            (conta as any).origem_id = os.id;
          }
          await tx.contas_receber.createMany({ data: contasData as any });
          // Recupera os IDs gerados
          const criadas = await tx.contas_receber.findMany({
            where: { origem_tipo: 'IMPORTACAO_LEITURA', origem_id: os.id },
            select: { id: true },
            orderBy: { id: 'asc' },
          });
          contasIds.push(...criadas.map((c) => c.id));
        }

        // Cria etapas em batch
        const etapaIds: number[] = [];
        if (listaAmbientes.length) {
          await tx.producao_etapas.createMany({
            data: listaAmbientes.map((nome, idx) => ({
              ordem_servico_id: os.id,
              nome_ambiente: nome.slice(0, 191),
              ordem: idx,
              status: 'PENDENTE',
              observacao: null,
            })),
          });
          const criadas = await tx.producao_etapas.findMany({
            where: { ordem_servico_id: os.id },
            select: { id: true },
            orderBy: { ordem: 'asc' },
          });
          etapaIds.push(...criadas.map((e) => e.id));
        }

        const fluxoAgenda = await this.garantirAgendaMedidaFinaImportacao(tx, {
          clienteId,
          nomeCliente,
          ambientesSelecionados: ambientesMedidaFina,
        });
        if (fluxoAgenda.alertas.length) {
          alertas.push(...fluxoAgenda.alertas);
        }

        return {
          ordem_servico_id: os.id,
          data_entrega_prevista: os.data_entrega_prevista,
          contas_receber_ids: contasIds,
          producao_etapa_ids: etapaIds,
          agenda_fabrica_id: fluxoAgenda.agendaId,
          venda_id: fluxoAgenda.vendaId,
          alertas,
        };
      },
      { timeout: 30000 },
    );
  }
}
