import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { ClausulasService } from '../clausulas/clausulas.service';
import { MailService } from '../mail/mail.service';
import PDFKitDoc from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { createHash, randomBytes } from 'crypto';
import { renderHeaderA4Png } from '../pdf/render-header-a4';
import { PDFDocument } from 'pdf-lib';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';
import { SignPdf } from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import {
  validarTransicaoStatusCliente,
  AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS,
} from '../shared/constantes/status-matrix';
import { getDataCorteContasReceber } from '../shared/constantes/status-matrix';
import { AgendaService } from '../agenda/agenda.service';

@Injectable()
export class ContratosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clausulasService: ClausulasService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly agendaService: AgendaService,
  ) {}

  private validarJanelaDataFim(
    dataInicio: Date,
    dataFimRaw?: string | Date | null,
  ) {
    if (!dataFimRaw) {
      throw new BadRequestException('Data de término é obrigatória.');
    }
    const dataFim = new Date(dataFimRaw);
    if (Number.isNaN(dataFim.getTime())) {
      throw new BadRequestException('Data de término inválida.');
    }
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(0, 0, 0, 0);

    const limite = new Date(inicio);
    limite.setFullYear(limite.getFullYear() + 1);

    if (fim < inicio) {
      throw new BadRequestException(
        'Data de término não pode ser menor que a data de início.',
      );
    }
    if (fim > limite) {
      throw new BadRequestException(
        'Data de término deve ser em até 1 ano após a data de início.',
      );
    }
    return dataFim;
  }

  private assinaturaA1Habilitada(): boolean {
    const enabled = String(
      this.config.get<string>('CONTRATO_A1_ASSINAR_PDF') ??
        process.env.CONTRATO_A1_ASSINAR_PDF ??
        'false',
    ).toLowerCase();
    return enabled === '1' || enabled === 'true' || enabled === 'sim';
  }

  private assinaturaA1Obrigatoria(): boolean {
    const required = String(
      this.config.get<string>('CONTRATO_A1_ASSINATURA_OBRIGATORIA') ??
        process.env.CONTRATO_A1_ASSINATURA_OBRIGATORIA ??
        'false',
    ).toLowerCase();
    return required === '1' || required === 'true' || required === 'sim';
  }

  private async assinarPdfComA1SeConfigurado(
    pdfBuffer: Buffer,
  ): Promise<Buffer> {
    if (!this.assinaturaA1Habilitada()) return pdfBuffer;

    const certPath = String(
      this.config.get<string>('CONTRATO_A1_CERT_PATH') ??
        process.env.CONTRATO_A1_CERT_PATH ??
        '',
    ).trim();
    const certPassword = String(
      this.config.get<string>('CONTRATO_A1_CERT_PASSWORD') ??
        process.env.CONTRATO_A1_CERT_PASSWORD ??
        '',
    );
    const certName = String(
      this.config.get<string>('CONTRATO_A1_SIGNER_NAME') ??
        process.env.CONTRATO_A1_SIGNER_NAME ??
        'ACASA ERP',
    ).trim();
    const certLocation = String(
      this.config.get<string>('CONTRATO_A1_SIGNER_LOCATION') ??
        process.env.CONTRATO_A1_SIGNER_LOCATION ??
        'Ribeirao Preto - SP',
    ).trim();
    const certReason = String(
      this.config.get<string>('CONTRATO_A1_SIGNER_REASON') ??
        process.env.CONTRATO_A1_SIGNER_REASON ??
        'Assinatura digital de contrato',
    ).trim();
    const signatureLength = Number(
      this.config.get<string>('CONTRATO_A1_SIGNATURE_LENGTH') ??
        process.env.CONTRATO_A1_SIGNATURE_LENGTH ??
        '20000',
    );

    const fail = (message: string): Buffer => {
      if (this.assinaturaA1Obrigatoria())
        throw new BadRequestException(message);
      return pdfBuffer;
    };

    if (!certPath)
      return fail(
        'Caminho do certificado A1 não configurado (CONTRATO_A1_CERT_PATH).',
      );
    if (!certPassword)
      return fail(
        'Senha do certificado A1 não configurada (CONTRATO_A1_CERT_PASSWORD).',
      );
    if (!fs.existsSync(certPath))
      return fail(
        `Certificado A1 não encontrado no caminho configurado: ${certPath}`,
      );

    try {
      const p12Buffer = fs.readFileSync(certPath);
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      pdflibAddPlaceholder({
        pdfDoc,
        reason: certReason,
        location: certLocation,
        name: certName,
        contactInfo: certName,
        signatureLength:
          Number.isFinite(signatureLength) && signatureLength > 0
            ? signatureLength
            : 20000,
      });

      const pdfComPlaceholder = Buffer.from(
        await pdfDoc.save({ useObjectStreams: false }),
      );

      const signer = new P12Signer(p12Buffer, { passphrase: certPassword });
      const assinado = await new SignPdf().sign(pdfComPlaceholder, signer);
      return Buffer.isBuffer(assinado) ? assinado : Buffer.from(assinado);
    } catch (err: any) {
      if (this.assinaturaA1Obrigatoria()) {
        throw new BadRequestException(
          `Falha ao assinar contrato com A1: ${err?.message || 'erro desconhecido'}`,
        );
      }
      return pdfBuffer;
    }
  }

  /**
   * Lista contratos. Se usuario for vendedor (funcionario_id e não admin), retorna apenas
   * contratos cuja venda é do seu cliente (vendedor_responsavel_id) ou onde ele é representante.
   */
  async listar(
    vendaId?: number,
    status?: string,
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null,
  ) {
    const where: any = {};
    if (vendaId) where.venda_id = vendaId;
    if (status) where.status = status;
    const funcionarioId =
      usuario?.funcionario_id != null && !usuario?.is_admin
        ? Number(usuario.funcionario_id)
        : null;
    if (funcionarioId != null) {
      where.venda = {
        OR: [
          { cliente: { vendedor_responsavel_id: funcionarioId } },
          { representante_venda_funcionario_id: funcionarioId },
        ],
      };
    }
    const contratos = await this.prisma.contratos.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { cliente: true, venda: true },
    });

    const ids = contratos.map((c) => c.id);
    if (ids.length === 0) return [];

    const comPdf = await this.prisma.arquivos.findMany({
      where: {
        owner_type: 'CONTRATO',
        owner_id: { in: ids },
        OR: [
          { slot_key: 'CONTRATO_ASSINADO_CLIENTE' },
          {
            categoria: 'RELATORIO',
            slot_key: null,
          },
        ],
      },
      select: { id: true, owner_id: true, slot_key: true },
      orderBy: { id: 'desc' },
    });
    const idsComPdf = new Set<number>();
    const pdfArquivoIdPorContrato = new Map<number, number>();
    for (const a of comPdf) {
      if (!a.owner_id) continue;
      idsComPdf.add(a.owner_id);
      const isAssinado = a.slot_key === 'CONTRATO_ASSINADO_CLIENTE';
      if (isAssinado) pdfArquivoIdPorContrato.set(a.owner_id, a.id);
      else if (!pdfArquivoIdPorContrato.has(a.owner_id)) pdfArquivoIdPorContrato.set(a.owner_id, a.id);
    }

    const base = contratos.map((c) => ({
      ...c,
      tem_pdf: idsComPdf.has(c.id),
      pdf_arquivo_id: pdfArquivoIdPorContrato.get(c.id) ?? null,
    }));

    if (status === 'VIGENTE') {
      const vendaIds = [...new Set((base as any[]).map((c) => c.venda_id).filter(Boolean))];
      const dataCorte = getDataCorteContasReceber();
      const clienteIds = [...new Set((base as any[]).map((c) => c.cliente_id).filter(Boolean))] as number[];

      let porVenda = new Map<number, { total_pago: number; tem_parcelas_abertas: boolean }>();
      if (vendaIds.length > 0) {
        const pagamentos = await this.prisma.vendas_pagamentos.findMany({
          where: { venda_id: { in: vendaIds } },
          select: {
            venda_id: true,
            valor: true,
            data_recebimento: true,
            status_financeiro_chave: true,
          },
        });
        for (const vid of vendaIds) {
          const list = pagamentos.filter((p) => p.venda_id === vid);
          const total_pago = list
            .filter((p) => p.data_recebimento != null)
            .reduce((s, p) => s + Number(p.valor ?? 0), 0);
          const tem_parcelas_abertas = list.some(
            (p) =>
              p.data_recebimento == null ||
              String(p.status_financeiro_chave || '').toUpperCase() === 'EM_ABERTO',
          );
          porVenda.set(vid, { total_pago, tem_parcelas_abertas });
        }
      }

      const clienteIdsComRecebivelPendente = new Set<number>();
      if (clienteIds.length > 0) {
        const contasPendentes = await this.prisma.contas_receber.findMany({
          where: {
            cliente_id: { in: clienteIds },
            vencimento_em: { lte: dataCorte },
            status: { not: 'PAGO' },
          },
          select: { cliente_id: true },
        });
        for (const c of contasPendentes) {
          if (c.cliente_id != null) clienteIdsComRecebivelPendente.add(c.cliente_id);
        }
        const titulosPendentes = await this.prisma.titulos_financeiros.findMany({
          where: {
            conta_receber_id: { not: null },
            conta_receber: { cliente_id: { in: clienteIds } },
            vencimento_em: { lte: dataCorte },
            status: { not: 'PAGO' },
          },
          select: { conta_receber: { select: { cliente_id: true } } },
        });
        for (const t of titulosPendentes) {
          const cid = (t as any).conta_receber?.cliente_id;
          if (cid != null) clienteIdsComRecebivelPendente.add(cid);
        }
      }

      return (base as any[]).map((c) => {
        const resumo = c.venda_id ? porVenda.get(c.venda_id) : null;
        const statusPagamento =
          c.cliente_id != null && clienteIdsComRecebivelPendente.has(c.cliente_id) ? 'PENDENTE' : 'OK';
        const statusVenda = String((c as any).venda?.status ?? '').toUpperCase();
        const aguardandoFinanceiro =
          ['MEDIDA_FINA_REALIZADA', 'AGUARDANDO_PRECIFICACAO'].includes(statusVenda) && statusPagamento === 'PENDENTE';
        return {
          ...c,
          resumo_financeiro: resumo
            ? {
                total_pago: resumo.total_pago,
                quitado: !resumo.tem_parcelas_abertas,
              }
            : null,
          status_pagamento: statusPagamento,
          aguardando_financeiro: aguardandoFinanceiro,
        };
      });
    }

    return base;
  }

  async buscarPorId(id: number) {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id },
      include: { cliente: true, venda: { include: { orcamento: true } } },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const assinaturaCliente = await this.prisma.assinaturas_log.findFirst({
      where: {
        contrato_id: contrato.id,
        OR: [
          { metodo_verificacao: { contains: 'portal seguro' } },
          { metodo_verificacao: { contains: 'Link WhatsApp/SMS' } },
        ],
      },
      orderBy: { data_hora: 'desc' },
      select: {
        data_hora: true,
        ip_address: true,
        dispositivo: true,
        hash_documento: true,
      },
    });
    const pdfAssinadoArquivo = await this.prisma.arquivos.findUnique({
      where: {
        owner_type_owner_id_slot_key: {
          owner_type: 'CONTRATO',
          owner_id: contrato.id,
          slot_key: 'CONTRATO_ASSINADO_CLIENTE',
        },
      },
      select: { id: true },
    });
    return {
      ...contrato,
      assinatura_cliente_registrada: !!assinaturaCliente,
      data_assinatura_cliente: assinaturaCliente?.data_hora ?? null,
      assinatura_cliente_ip: assinaturaCliente?.ip_address ?? null,
      assinatura_cliente_dispositivo: assinaturaCliente?.dispositivo ?? null,
      assinatura_cliente_hash_documento:
        assinaturaCliente?.hash_documento ?? null,
      pdf_assinado_arquivo_id: pdfAssinadoArquivo?.id ?? null,
    };
  }

  /**
   * Remove o PDF do contrato assinado pelo cliente (slot CONTRATO_ASSINADO_CLIENTE).
   * Apaga o registro em arquivos e o arquivo físico. Não altera o status do contrato.
   */
  async removerPdfAssinadoCliente(contratoId: number): Promise<{ ok: boolean }> {
    const arquivo = await this.prisma.arquivos.findUnique({
      where: {
        owner_type_owner_id_slot_key: {
          owner_type: 'CONTRATO',
          owner_id: contratoId,
          slot_key: 'CONTRATO_ASSINADO_CLIENTE',
        },
      },
      select: { id: true, url: true },
    });
    if (!arquivo) {
      throw new NotFoundException(
        'Não há PDF assinado vinculado a este contrato para excluir.',
      );
    }
    try {
      const rel = String(arquivo.url || '').replace(/^\//, '');
      const abs = path.join(process.cwd(), rel);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {}
    await this.prisma.arquivos.delete({ where: { id: arquivo.id } });
    return { ok: true };
  }

  /** Gera o próximo número de contrato no formato CONT-YYYY-NNN (ex.: CONT-2025-001). */
  private async proximoNumeroContrato(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `CONT-${ano}-`;
    const ultimos = await this.prisma.contratos.findMany({
      where: { numero: { startsWith: prefixo } },
      select: { numero: true },
      orderBy: { id: 'desc' },
      take: 1,
    });
    let proximo = 1;
    if (ultimos.length > 0) {
      const numPart = ultimos[0].numero.slice(prefixo.length);
      const n = parseInt(numPart, 10);
      if (!Number.isNaN(n)) proximo = n + 1;
    }
    return `${prefixo}${String(proximo).padStart(3, '0')}`;
  }

  async criar(dto: CreateContratoDto) {
    const venda = await this.prisma.vendas.findUnique({
      where: { id: dto.venda_id },
      include: { cliente: { select: { vendedor_responsavel_id: true } } },
    });
    if (!venda) throw new NotFoundException('Venda não encontrada.');

    const numero = dto.numero?.trim()
      ? dto.numero.trim()
      : await this.proximoNumeroContrato();

    const dataInicio = new Date();
    const dataFim = this.validarJanelaDataFim(dataInicio, dto.data_fim);

    const vendedorId = (venda as any).vendedor_responsavel_id ?? venda.cliente?.vendedor_responsavel_id ?? undefined;

    return this.prisma.contratos.create({
      data: {
        cliente_id: venda.cliente_id,
        venda_id: dto.venda_id,
        vendedor_responsavel_id: vendedorId,
        numero,
        descricao: dto.descricao ?? null,
        status: dto.status,
        valor: dto.valor,
        data_inicio: dataInicio,
        data_fim: dataFim,
        assinatura_presencial: dto.assinatura_presencial ?? false,
      },
      include: { cliente: true, venda: true },
    });
  }

  async atualizar(id: number, dto: UpdateContratoDto, criadoPorUsuarioId?: number) {
    const atual = await this.buscarPorId(id);
    const dataInicioBase = atual.data_inicio
      ? new Date(atual.data_inicio)
      : new Date();

    if (dto.venda_id !== undefined && dto.venda_id != null) {
      const venda = await this.prisma.vendas.findUnique({
        where: { id: dto.venda_id },
      });
      if (!venda) throw new NotFoundException('Venda não encontrada.');
    }

    const atualizado = await this.prisma.contratos.update({
      where: { id },
      data: {
        venda_id: dto.venda_id ?? undefined,
        numero: dto.numero,
        descricao: dto.descricao,
        status: dto.status,
        valor: dto.valor,
        data_inicio: undefined,
        data_fim:
          dto.data_fim !== undefined
            ? this.validarJanelaDataFim(dataInicioBase, dto.data_fim)
            : undefined,
        ...(dto.assinatura_presencial !== undefined && {
          assinatura_presencial: dto.assinatura_presencial,
        }),
      },
      include: { cliente: true, venda: true },
    });

    const statusNovo = String(dto.status || '').toUpperCase();
    const statusAnterior = String((atual as any).status || '').toUpperCase();
    const vendaId = atualizado.venda_id ?? null;

    // Quando o contrato deixa de ser VIGENTE (ex.: volta para RASCUNHO), limpar evento "Agendar medida fina" da agenda para o fluxo poder ser refeito ao voltar a vigente
    if (vendaId && statusAnterior === 'VIGENTE' && statusNovo !== 'VIGENTE') {
      await this.limparAgendaMedidaFinaAoDeixarDeSerVigente(vendaId);
    }

    // Se o status foi alterado para VIGENTE, disparar envio para produção (venda/cliente + agenda fábrica)
    if (statusNovo === 'VIGENTE' && vendaId) {
      await this.atualizarStatusVendaParaProducaoAoVigorarContrato({
        venda_id: atualizado.venda_id,
        cliente_id: (atualizado as any).cliente_id ?? (atualizado as any).venda?.cliente_id ?? null,
      });
      await this.garantirAgendaProducaoDaVendaAoVigorarContrato(
        {
          id: atualizado.id,
          venda_id: atualizado.venda_id,
          cliente_id: (atualizado as any).cliente_id ?? (atualizado as any).venda?.cliente_id ?? null,
        },
        criadoPorUsuarioId,
      );
    }

    return atualizado;
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.prisma.contratos.delete({ where: { id } });
  }

  /**
   * Registra a assinatura visual (imagem) vinculada ao contrato.
   * Importante: não altera status para VIGENTE.
   * O status VIGENTE é definido exclusivamente no fluxo de aceite público do cliente.
   */
  async assinar(
    id: number,
    dto: { data_assinatura?: string; assinatura_base64?: string },
  ) {
    const contrato = await this.buscarPorId(id);
    const dataAssinatura = dto.data_assinatura
      ? new Date(dto.data_assinatura)
      : new Date();

    let urlAssinatura: string | null = null;
    if (dto.assinatura_base64 && dto.assinatura_base64.trim()) {
      const base64 = dto.assinatura_base64.replace(
        /^data:image\/\w+;base64,/,
        '',
      );
      const buffer = Buffer.from(base64, 'base64');
      const dir = path.join(
        process.cwd(),
        'uploads',
        'contratos',
        'assinaturas',
      );
      fs.mkdirSync(dir, { recursive: true });
      const filename = `contrato_${id}_assinatura.png`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, buffer);
      urlAssinatura = `/uploads/contratos/assinaturas/${filename}`;

      const slotKey = 'ASSINATURA_CLIENTE';
      const existing = await this.prisma.arquivos.findUnique({
        where: {
          owner_type_owner_id_slot_key: {
            owner_type: 'CONTRATO',
            owner_id: id,
            slot_key: slotKey,
          },
        },
      });
      if (existing) {
        await this.prisma.arquivos.update({
          where: { id: existing.id },
          data: {
            url: urlAssinatura,
            filename,
            nome: 'Assinatura do contratante',
            mime_type: 'image/png',
            tamanho: buffer.length,
          },
        });
      } else {
        await this.prisma.arquivos.create({
          data: {
            owner_type: 'CONTRATO',
            owner_id: id,
            categoria: 'ASSINATURA_CLIENTE',
            slot_key: slotKey,
            url: urlAssinatura,
            filename,
            nome: 'Assinatura do contratante',
            mime_type: 'image/png',
            tamanho: buffer.length,
          },
        });
      }
    }

    const contratoAtualizado = await this.prisma.contratos.update({
      where: { id },
      data: {
        data_assinatura: dataAssinatura,
      } as any,
      include: { cliente: true, venda: true },
    });

    return contratoAtualizado;
  }

  private async garantirContaReceberDeVendaAssinada(contrato: {
    venda_id?: number | null;
    cliente_id?: number | null;
  }) {
    const vendaId = Number(contrato?.venda_id || 0);
    const clienteId = Number(contrato?.cliente_id || 0);
    if (!Number.isFinite(vendaId) || vendaId <= 0) return;

    const existente = await this.prisma.contas_receber.findFirst({
      where: {
        origem_tipo: 'VENDA',
        origem_id: vendaId,
        cliente_id: clienteId > 0 ? clienteId : undefined,
      },
      select: { id: true },
    });
    if (existente) return;

    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      include: { pagamentos: true },
    });
    if (!venda) return;

    const pagamentos = Array.isArray((venda as any).pagamentos)
      ? (venda as any).pagamentos
      : [];

    const somaPagamentos = pagamentos.length
      ? pagamentos.reduce(
          (sum: number, p: any) => sum + Number(p?.valor || 0),
          0,
        )
      : 0;
    const valorVenda = Number((venda as any).valor_vendido || (venda as any).valor_total || 0);
    // Usar sempre o maior: valor da venda (com juros) ou soma das parcelas, para contas a receber refletirem o total a receber
    const valorTotal =
      pagamentos.length > 0 ? Math.max(somaPagamentos, valorVenda) : valorVenda;

    const statusPagamento = pagamentos.length
      ? String(
          pagamentos.every((p: any) => p?.data_recebimento)
            ? 'PAGO'
            : 'EM_ABERTO',
        )
      : 'EM_ABERTO';

    const vencimento = pagamentos
      .map((p: any) => p?.data_prevista_recebimento || null)
      .find(Boolean);

    const recebidoEm = pagamentos.length
      ? pagamentos.every((p: any) => p?.data_recebimento)
        ? new Date()
        : null
      : null;

    await this.prisma.contas_receber.create({
      data: {
        cliente_id: clienteId > 0 ? clienteId : null,
        origem_tipo: 'VENDA',
        origem_id: vendaId,
        descricao: `Venda #${vendaId}`,
        valor_original: valorTotal,
        valor_compensado: 0,
        status: statusPagamento,
        vencimento_em: vencimento
          ? new Date(vencimento)
          : new Date((venda as any).data_venda || new Date()),
        recebido_em: recebidoEm,
      },
    });
  }

  /**
   * Quando o contrato deixa de ser vigente (ex.: volta para rascunho), cancela os eventos
   * "só painel" (constante do pipeline) dessa venda na agenda fábrica.
   */
  private async limparAgendaMedidaFinaAoDeixarDeSerVigente(vendaId: number) {
    const categorias = AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS as readonly string[];
    const eventos = await this.prisma.agenda_fabrica.findMany({
      where: {
        venda_id: vendaId,
        categoria: { in: [...categorias] },
        status: { not: 'CANCELADO' },
      },
      select: { id: true },
    });
    if (eventos.length > 0) {
      console.log(`[Contrato/Agenda] limparAgendaMedidaFina venda ${vendaId}: cancelando ${eventos.length} evento(s) id=${eventos.map((e) => e.id).join(',')}`);
    }
    for (const ev of eventos) {
      await this.prisma.agenda_fabrica.update({
        where: { id: ev.id },
        data: { status: 'CANCELADO' },
      });
    }
  }

  private async garantirAgendaProducaoDaVendaAoVigorarContrato(
    contrato: { id: number; venda_id?: number | null; cliente_id?: number | null },
    criadoPorUsuarioId?: number,
  ) {
    const vendaId = Number(contrato?.venda_id || 0);
    if (!Number.isFinite(vendaId) || vendaId <= 0) return;

    // Só não cria se já existir um evento "só painel" PENDENTE para esta venda (regra do pipeline)
    const categoriasPainel = AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS as readonly string[];
    const existentePendente = await this.prisma.agenda_fabrica.findFirst({
      where: {
        venda_id: vendaId,
        categoria: { in: [...categoriasPainel] },
        status: 'PENDENTE',
      },
      select: { id: true },
    });
    if (existentePendente) {
      console.log(`[Contrato/Agenda] garantirAgendaProducao venda ${vendaId}: já existe evento pendente id=${existentePendente.id}, não cria`);
      return;
    }

    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      select: { id: true, cliente_id: true },
    });
    if (!venda) return;

    const clienteId =
      Number(contrato?.cliente_id || venda.cliente_id || 0) || null;
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);

    const created = await this.agendaService.criarAgendaFabricaAutomatica({
      titulo: `Aguardando medida fina - Venda #${vendaId}`,
      inicio_em: inicio,
      fim_em: fim,
      subetapa: 'MEDIDA_FINA',
      origem_fluxo: 'LOJA_VENDA',
      status: 'PENDENTE',
      venda_id: vendaId,
      cliente_id: clienteId,
      criado_por_usuario_id:
        criadoPorUsuarioId != null && Number.isFinite(criadoPorUsuarioId)
          ? criadoPorUsuarioId
          : null,
    });
    console.log(`[Contrato/Agenda] garantirAgendaProducao venda ${vendaId}: criado evento agenda_fabrica id=${created.id} (AGENDAR_MEDIDA_FINA PENDENTE)`);
  }

  private async atualizarStatusVendaParaProducaoAoVigorarContrato(contrato: {
    venda_id?: number | null;
    cliente_id?: number | null;
  }) {
    const vendaId = Number(contrato?.venda_id || 0);
    if (!Number.isFinite(vendaId) || vendaId <= 0) return;

    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      select: { id: true, status: true, cliente_id: true },
    });
    if (!venda) return;

    const statusAtualVenda = String(venda.status || '').toUpperCase();
    const clienteId = Number(contrato?.cliente_id ?? venda.cliente_id ?? 0) || null;

    // 1) Primeiro leva venda (e cliente) para CONTRATO_ASSINADO se ainda não estiver
    if (statusAtualVenda !== 'CONTRATO_ASSINADO') {
      const valContrato = validarTransicaoStatusCliente({
        atual: statusAtualVenda,
        proximo: 'CONTRATO_ASSINADO',
      });
      if (valContrato.ok) {
        await this.prisma.vendas.update({
          where: { id: vendaId },
          data: { status: 'CONTRATO_ASSINADO' },
        });
        if (clienteId) {
          const cliente = await this.prisma.cliente.findUnique({
            where: { id: clienteId },
            select: { id: true, status: true },
          });
          if (
            cliente &&
            validarTransicaoStatusCliente({
              atual: cliente.status,
              proximo: 'CONTRATO_ASSINADO',
            }).ok
          ) {
            await this.prisma.cliente.update({
              where: { id: clienteId },
              data: { status: 'CONTRATO_ASSINADO' },
            });
          }
        }
      }
    }

    // 2) Depois leva venda (e cliente) para AGENDAR_MEDIDA_FINA (aguardando medida fina)
    const vendaAtual = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      select: { status: true },
    });
    const statusAtual = String(vendaAtual?.status || '').toUpperCase();
    const statusDestino = 'AGENDAR_MEDIDA_FINA';
    if (statusAtual === statusDestino) return;

    const validacao = validarTransicaoStatusCliente({
      atual: statusAtual,
      proximo: statusDestino,
    });
    if (!validacao.ok) return;

    await this.prisma.vendas.update({
      where: { id: vendaId },
      data: { status: statusDestino },
    });
    if (clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, status: true },
      });
      if (
        cliente &&
        validarTransicaoStatusCliente({
          atual: cliente.status,
          proximo: statusDestino,
        }).ok
      ) {
        await this.prisma.cliente.update({
          where: { id: clienteId },
          data: { status: statusDestino },
        });
      }
    }
  }

  // =======================================
  // PDF
  // =======================================

  private readonly DEFAULT_TEXTOS_CONTRATO: Record<string, string> = {
    CABECALHO:
      'Pelo presente instrumento e na melhor forma de direito, de um lado, [[contratada_razao_social]], inscrita no CNPJ sob o nº [[contratada_cnpj]][[contratada_ie_frase]], com sede em [[contratada_endereco_completo]], doravante denominada simplesmente como CONTRATADA, e do outro lado, [[cliente_razao_social_ou_nome_completo]] inscrito no [[cliente_documento_tipo]] sob o nº [[cliente_documento_numero]][[cliente_ie_frase]], residente e domiciliado em [[cliente_endereco_completo]], doravante denominado simplesmente como CONTRATANTE, têm entre si ajustado o presente negócio de compra e venda de mercadorias e prestação de serviços, mediante as cláusulas e condições a seguir.',
    OBJETO:
      '§ Primeiro – O objeto do presente contrato é a comercialização de móveis, descritos e caracterizados nos projetos anexos, previamente aprovados por rubrica pelo CONTRATANTE. Os móveis serão entregues em [[cliente_endereco_completo]].\n\nItem/ambiente: Descritivo:\n[[lista_itens_venda]]\n\nO CONTRATANTE declara-se ciente de que a partir deste momento iniciou-se o processo de produção dos produtos acima adquiridos, e que eles foram projetados e personalizados exclusivamente para seu ambiente, não possibilitando a comercialização para com terceiros.\n\n§ Segundo – Fazem parte integrante do presente instrumento as vistas dos projetos que foram definidos e assinados pelas partes, segundo descrito na cláusula acima, elaborados conforme as medidas e dimensões dos ambientes. A CONTRATADA não se responsabiliza por alterações de medidas e projetos posteriores à assinatura dos pedidos e projetos negociados.\n\n§ Terceiro – Os eletrodomésticos, iluminação, vidros, espelhos, cubas de pias, granitos e demais acessórios constantes nos projetos e não descritos no primeiro parágrafo não fazem parte do escopo de fornecimento da CONTRATADA.',
    PRECO_CONDICOES:
      '§ Único – O preço certo e ajustado entre as partes, quanto ao objeto do presente, no valor de [[valor_total_numerico]] ([[valor_total_por_extenso]]).\n\nForma de pagamento quanto ao objeto do presente: [[descricao_forma_pagamento_contrato]].\n\nPara pagamento: [[contratada_dados_pagamento]].\n\nData da venda: [[data_venda]]. Os valores e condições acima descritos decorrem da venda nº [[venda_id]], vinculada ao orçamento nº [[orcamento_id]], que integra este contrato para todos os fins.',
    PRAZO_ENTREGA:
      '§ Primeiro – Fica acertado entre as partes que o prazo de entrega dos bens, objeto deste contrato, será entregue e instalado até o dia [[data_prazo_entrega_por_extenso]].\n\nParágrafo único. Em caso de atraso da CONTRATADA, deverá incidir sobre o valor do presente instrumento multa pecuniária de 20%, juros de 1% ao mês do valor total do serviço contratado.\n\n§ Segundo – O CONTRATANTE está ciente que receberá apenas os produtos contratados. Não sendo passível a inclusão de brindes e/ou presentes, móveis extras que não estejam descritos e relacionados neste instrumento.\n\n§ Terceiro – O CONTRATANTE também está ciente de que o prazo de entrega dos objetos do contrato é computado após a tirada das medidas finais do(s) ambiente(s). Caso a obra não esteja concluída no momento da assinatura do contrato, não sendo possível medi-las, o prazo será postergado, podendo acarretar alteração do prazo de entrega e correção monetária do valor deste instrumento.\n\n§ Quarto – O CONTRATANTE está ciente que precisa fornecer o(s) ambiente(s) em condições propícias para a entrega e instalação dos ambientes/móveis, ou seja, obra finalizada e ambiente limpo.\n\n§ Quinto – O CONTRATANTE está ciente de que, caso ocorra qualquer impossibilidade de entrega de seus móveis, fica estabelecido o prazo de 5 dias (úteis) para a CONTRATADA manter os produtos armazenados em espaço próprio. Ultrapassado este prazo, incidirá uma multa de [[valor_armazenagem_dia]] por dia (a cada ambiente) em que o móvel permanecer ocupando o espaço, sendo esse pago à vista um dia antes da entrega. Além disso, em caso de abandono dos materiais para além de 6 meses do prazo estipulado para a entrega e/ou retirada, ocorrerá a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\n§ Sexto – Este instrumento estabelece que qualquer alteração de projeto, sendo referente à forma construtiva do móvel e/ou troca de materiais, acarretará ajuste de valores a serem pagos pelo CONTRATANTE.\n\n§ Sétimo – Em caso de desistência, após a assinatura do presente instrumento, fica estabelecido o valor correspondente a 20% (vinte por cento) do valor do contrato para ressarcimento das despesas tidas com elaboração e/ou adequação de projetos, sem prejuízo do ressarcimento das despesas com frete e outras de caráter administrativo, relativas ao contrato ora firmado, servindo o contrato de título executivo extrajudicial. Fica autorizado à CONTRATADA a reter o valor acima do valor já pago, restituindo-se apenas a diferença.',
    ARMAZENAGEM_DESISTENCIA:
      'O CONTRATANTE declara-se ciente de que, a partir da assinatura deste contrato, inicia-se o processo de produção dos produtos, que são personalizados e feitos sob medida, não sendo possível sua revenda a terceiros.\n\nCaso haja impossibilidade de entrega por motivo imputável ao CONTRATANTE, a CONTRATADA poderá manter os produtos armazenados pelo prazo de até 5 (cinco) dias úteis sem cobrança. Após este prazo, incidirá multa diária de [[valor_armazenagem_dia]] por ambiente ou módulo, a ser paga integralmente antes da nova data de entrega.\n\nEm caso de abandono dos materiais por período superior a 6 (seis) meses contados da data prevista para entrega e/ou retirada, poderá ocorrer a perda da propriedade dos bens, nos termos do art. 1.275, inciso II do Código Civil.\n\nEm caso de desistência injustificada após a assinatura, fica estabelecido que o CONTRATANTE pagará à CONTRATADA multa compensatória de 20% (vinte por cento) do valor total do contrato, a título de ressarcimento de despesas com elaboração de projeto, administração e custos de produção já iniciados, sem prejuízo do ressarcimento de fretes e demais despesas comprovadas.',
    GARANTIA:
      '§ Primeiro – A CONTRATADA concede garantia de [[prazo_garantia_anos]] (cinco) anos sobre os móveis planejados fornecidos, contados a partir da data de entrega e instalação, abrangendo defeitos de fabricação e montagem, desde que respeitadas as condições de uso e conservação indicadas no Certificado de Garantia e Manual do Proprietário, que integram o presente instrumento e deverão ser lidos e rubricados no ato da assinatura.\n\n§ Segundo – Para a validade e manutenção da garantia, é obrigatória a realização de revisão anual, destinada à verificação de regulagens, fixações, funcionamento de ferragens e do estado geral dos móveis.\n\n§ Terceiro – A primeira revisão anual será gratuita, devendo ser solicitada pelo CONTRATANTE no prazo de até 12 (doze) meses após a instalação.\n\n§ Quarto – As revisões subsequentes poderão ser realizadas mediante agendamento prévio e serão cobradas conforme valores vigentes à época, sendo o valor a partir de [[valor_revisao_base]] (duzentos e cinquenta reais) por visita. Eventuais peças, materiais ou componentes que necessitem de substituição não estão inclusos nesse valor, sendo orçados e cobrados à parte, mediante aprovação do CONTRATANTE.\n\n§ Quinto – Não estão cobertos pela garantia o desgaste natural decorrente do uso, bem como danos ocasionados por agentes externos, tais como infiltrações de água, infestação de cupins ou similares, calor excessivo, contato prolongado com água ou umidade, além de oxidação ou ferrugem de partes metálicas, mau uso, falta de manutenção, umidade, infiltrações, alterações no ambiente ou intervenções realizadas por terceiros.',
    SERVICOS:
      '§ Único – Pelo presente instrumento, [[cliente_razao_social_ou_nome_completo]] contrata a empresa [[contratada_razao_social]] para a execução dos serviços de montagem, acabamento e entrega dos produtos, conforme os projetos negociados pelas partes e anexados ao presente instrumento.',
    CONDICOES_GERAIS:
      '§ Primeiro – As partes não assumem nenhuma responsabilidade por ajustes verbais fora das condições aqui estabelecidas e especificadas. Qualquer condição excepcional deverá constar, expressamente, em adendo a este instrumento.\n\n§ Segundo – O CONTRATANTE desde já autoriza seus familiares e/ou empregados a assinarem os documentos comprobatórios da entrega das mercadorias.\n\n§ Terceiro – Obrigações importantes ao cliente:\n\n• O local de entrega deverá estar apto a receber os móveis, e o espaço para instalação dos armários deverá estar vago. Em caso de reformas, elas deverão estar devidamente concluídas e os ambientes completamente limpos. Uma vez programada a entrega, se por qualquer motivo esta for alterada pelo cliente, ela terá que respeitar uma nova programação na logística da empresa, cuja data deverá ser agendada pela CONTRATADA. Os produtos serão entregues no seu local de destino para serem posteriormente montados pela equipe da CONTRATADA.\n\n• A montagem só poderá ser realizada após a obra estar totalmente concluída com: pontos elétricos, hidráulicos e de gás executados conforme a planta e cronogramas fornecidos pelo CONTRATANTE.\n\n• Desta forma, os serviços de instalação do mobiliário não serão iniciados caso não sejam cumpridos alguns dos itens citados neste parágrafo. Caso contrário, a CONTRATADA não se responsabiliza por possíveis danos que possam ocorrer aos produtos do CONTRATANTE.',
    RESPONSABILIDADES:
      '§ Primeiro – A CONTRATADA não se responsabilizará pelas instalações de tampos de granitos, aço, inox, ou qualquer outro material que não seja o especificado pelo projeto técnico. Bem como pelas instalações de telefones, interfones, antenas de TV ou qualquer outro aparelho que porventura possa ser instalado sem a prévia orientação de um profissional especializado e/ou técnico de sua área.\n\n§ Segundo – O CONTRATANTE se responsabiliza a fornecer no momento da assinatura do projeto ou em até 7 (sete) dias úteis antes da data prevista para instalação: plantas elétricas, hidráulicas, de gás ou de quaisquer outros materiais não aparentes que eventualmente possam ser danificados com a instalação; caso essas plantas não sejam fornecidas, a CONTRATADA não se responsabiliza por eventuais danos causados.\n\n§ Terceiro – A CONTRATADA isenta-se de qualquer responsabilidade sobre instalações elétricas fora a dos materiais por ela fornecidos. As equipes de instalação estão aptas apenas a aplicar as iluminações ao móvel; as instalações além desta condição são de responsabilidade do cliente.\n\n§ Quarto – Fica aos cuidados do CONTRATANTE a retirada de molduras de gesso, rodapés ou qualquer outro acabamento que interfira na instalação dos produtos, antes da entrega dos móveis; os técnicos estão aptos a prestar toda orientação necessária.\n\n§ Quinto – Qualquer alteração na obra realizada após as medições, que não tenham sido determinadas no projeto e afetem o mesmo, poderá gerar alterações no prazo de entrega e conclusão da montagem, além de novos custos, e serão de inteira responsabilidade do cliente.\n\n§ Sexto – A perfeita execução de seu projeto requer, durante a montagem, alguns ajustes de acabamento que poderão provocar resíduos e pó; além disso, as embalagens dos produtos após abertas geram volumes que ocupam espaços consideráveis.\n\n§ Sétimo – Após a conclusão da montagem, os técnicos estarão aptos a deslocá-los para locais previamente indicados pelo cliente e farão a limpeza dos resíduos resultantes da montagem e manutenção dos ambientes.\n\n§ Oitavo – Os mecanismos utilizados para fixação das peças junto a paredes, quando o caso, são dimensionados para sustentação das peças, não sendo aconselhável a colocação de pesos extras (tampos de granito ou mármore, pias, cubas, eletrodomésticos com peso excessivo e outros).\n\n§ Nono – Quanto à montagem dos projetos em paredes que não sejam de alvenaria padrão (não convencionais, drywall e outras), o fato deverá constar no presente contrato e projeto. Para providências específicas de montagem, acertamos que a CONTRATADA não assume a responsabilidade pela resistência das referidas paredes na viabilidade, execução e utilização do presente projeto.',
    CESSAO_IMAGEM:
      'Este instrumento estabelece a autorização do CONTRATANTE à CONTRATADA, aqui previamente descrita, a dispor de seus dados pessoais, conforme os artigos 7.º e 11.º da Lei n.º 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), e autoriza a utilização de sua imagem e/ou voz, de acordo com os parágrafos dispostos abaixo:\n\n§ Primeiro – O CONTRATANTE autoriza a CONTRATADA a realizar o tratamento, ou seja, a utilizar os dados relacionados à divulgação, em fotos e vídeo do mobiliário contratado, para finalidade de promoção da campanha publicitária de interesse da CONTRATADA, ocorrendo a divulgação no seu site e demais mídias, online e off-line, já existentes ou que venham a existir.\n\n§ Segundo – O CONTRATANTE autoriza que a CONTRATADA utilize a imagem para divulgação de campanha publicitária de seu interesse, adotando todas as medidas de proteção de dados, visando a preservação de seu direito à intimidade, coibindo o uso com finalidade distinta da prevista neste termo.',
    IMAGEM:
      'O CONTRATANTE autoriza a CONTRATADA a utilizar imagens e vídeos dos ambientes mobiliados, exclusivamente para fins de divulgação de portfólio e campanhas publicitárias da CONTRATADA, em mídias online e off-line, observada a legislação de proteção de dados pessoais (Lei nº 13.709/2018 – LGPD), comprometendo-se a CONTRATADA a não expor dados sensíveis ou informações que possam comprometer a intimidade do CONTRATANTE.',
    FORO: '§ Primeiro – As partes elegem o Foro desta cidade, [[cidade_foro]], [[estado_foro]], para dirimir quaisquer dúvidas decorrentes deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.\n\n§ Segundo – Após a leitura do inteiro teor do presente contrato, as partes, estando de pleno acordo, subscrevem o presente instrumento em duas vias de igual teor e forma.\n\n[[cidade_data_assinatura]]',
    ASSINATURA_ELETRONICA:
      '11.1. As partes declaram-se cientes e concordam que este instrumento, bem como seus aditamentos e agendamentos, poderão ser assinados de forma eletrônica, sendo considerados válidos e plenamente eficazes para todos os fins de direito.\n\n11.2. O aceite será formalizado através de uma das seguintes modalidades, que as partes reconhecem como meios de prova idôneos para confirmar a autoria e integridade do documento:\n\nE-mail: Resposta positiva à mensagem enviada pelo sistema a partir do endereço cadastrado;\n\nWhatsApp/Mensageria: Interação positiva (clique em botões de aceite ou resposta de texto) em link enviado ao número de telefone celular validado no cadastro;\n\nAssinatura Digital: Clique em "Aceito" ou "Assinar" em ambiente logado com registro de IP, data, hora e código de autenticação único (Hash).\n\n11.3. As partes renunciam a qualquer pretensão de invalidar este contrato sob o argumento de ausência de assinatura física ou reconhecimento de firma, reconhecendo que os registros eletrônicos gerados pelo sistema ERP possuem força executiva e plena validade jurídica.',
  };

  /** Formata CNPJ para exibição: 12345678000199 -> 12.345.678/0001-99 */
  private maskCnpj(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (s.length !== 14) return String(val || '');
    return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`;
  }

  /** Formata CPF para exibição: 12345678901 -> 123.456.789-01 */
  private maskCpf(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (s.length !== 11) return String(val || '');
    return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
  }

  /** Formata RG para exibição: 439216916 -> 43.921.691-6 (até 9 dígitos) */
  private maskRg(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (!s.length) return String(val || '');
    if (s.length <= 8) {
      return s.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2');
    }
    const t = s.slice(0, 9);
    return `${t.slice(0, 2)}.${t.slice(2, 5)}.${t.slice(5, 8)}-${t.slice(8)}`;
  }

  /** Formata CEP para exibição: 14066404 -> 14066-404 */
  private maskCep(val: string | null | undefined): string {
    const s = String(val || '').replace(/\D/g, '');
    if (s.length !== 8) return String(val || '');
    return `${s.slice(0, 5)}-${s.slice(5)}`;
  }

  /** Converte valor em reais para extenso (ex.: 48950.00 -> "quarenta e oito mil e novecentos e cinquenta reais") */
  private valorPorExtensoReais(valor: number): string {
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) return 'zero reais';
    const inteiro = Math.floor(n);
    const centavos = Math.round((n - inteiro) * 100);
    const U = [
      '',
      'um',
      'dois',
      'três',
      'quatro',
      'cinco',
      'seis',
      'sete',
      'oito',
      'nove',
    ];
    const U0 = [
      'zero',
      'um',
      'dois',
      'três',
      'quatro',
      'cinco',
      'seis',
      'sete',
      'oito',
      'nove',
    ];
    const D10 = [
      'dez',
      'onze',
      'doze',
      'treze',
      'catorze',
      'quinze',
      'dezesseis',
      'dezessete',
      'dezoito',
      'dezenove',
    ];
    const D = [
      '',
      '',
      'vinte',
      'trinta',
      'quarenta',
      'cinquenta',
      'sessenta',
      'setenta',
      'oitenta',
      'noventa',
    ];
    const C = [
      '',
      'cento',
      'duzentos',
      'trezentos',
      'quatrocentos',
      'quinhentos',
      'seiscentos',
      'setecentos',
      'oitocentos',
      'novecentos',
    ];
    const esc = (x: number, useZero: boolean): string => {
      if (x === 0) return useZero ? 'zero' : '';
      const c = Math.floor(x / 100);
      const r = x % 100;
      const dezena = Math.floor(r / 10);
      const un = r % 10;
      const partC = c > 0 ? (c === 1 && r === 0 ? 'cem' : C[c]) : '';
      const partD =
        r < 10
          ? un > 0
            ? U[un]
            : ''
          : r < 20
            ? D10[r - 10]
            : D[dezena] + (un > 0 ? ' e ' + U[un] : '');
      const partes = [partC, partD].filter(Boolean);
      return partes.join(partC && partD ? ' e ' : '');
    };
    const mil = Math.floor(inteiro / 1000);
    const rest = inteiro % 1000;
    let reaisStr = '';
    if (mil > 0) {
      reaisStr = mil === 1 ? 'mil' : esc(mil, false) + ' mil';
      if (rest > 0) reaisStr += ' e ' + esc(rest, false);
    } else {
      reaisStr = esc(rest, true);
    }
    reaisStr = reaisStr.trim() || 'zero';
    reaisStr += inteiro === 1 ? ' real' : ' reais';
    if (centavos > 0)
      reaisStr +=
        ' e ' +
        (centavos === 1 ? 'um centavo' : esc(centavos, false) + ' centavos');
    return reaisStr;
  }

  private substituirPlaceholders(
    texto: string,
    mapa: Record<string, string>,
  ): string {
    let out = String(texto || '');
    for (const [key, value] of Object.entries(mapa)) {
      const token = `[[${key}]]`;
      out = out.split(token).join(value ?? '');
    }
    return out;
  }

  private montarListaItensVenda(venda: any): string {
    const itens = venda?.itens && Array.isArray(venda.itens) ? venda.itens : [];
    if (!itens.length) return '-';
    return itens
      .map((it: any, idx: number) => {
        const nome = String(
          it.nome_ambiente || `Ambiente ${idx + 1}`,
        ).toUpperCase();
        const desc = String(it.descricao || '').trim();
        return `${idx + 1}. ${nome}\n${desc ? desc : ''}`.trim();
      })
      .join('\n\n');
  }

  private renderTabelaItensVenda(
    doc: any,
    venda: any,
    left: number,
    right: number,
  ) {
    const itensVenda =
      venda?.itens && Array.isArray(venda.itens) ? venda.itens : [];
    const itensOrcamento =
      venda?.orcamento?.itens && Array.isArray(venda.orcamento.itens)
        ? venda.orcamento.itens
        : [];
    const normalizar = (v: any) =>
      String(v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const base = itensVenda.length ? itensVenda : itensOrcamento;
    const itens = base.map((it: any, idx: number) => {
      const obsVenda = String(it?.observacao || '').trim();
      if (obsVenda) return it;
      const cand =
        itensOrcamento.find(
          (o: any) =>
            normalizar(o?.nome_ambiente) === normalizar(it?.nome_ambiente) &&
            normalizar(o?.descricao) === normalizar(it?.descricao),
        ) || itensOrcamento[idx];
      return { ...it, observacao: String(cand?.observacao || '').trim() };
    });
    if (!itens.length) return;

    const tableWidth = right - left;
    const colAmbW = 130;
    const colDescW = tableWidth - colAmbW;

    const margemInferior = 60;

    // Cabeçalho da tabela
    this.garantirEspacoPagina(doc, 40, margemInferior);

    const headerY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#000')
      .text('Item/ ambiente:', left, headerY, { width: colAmbW })
      .text('Descritivo:', left + colAmbW, headerY, {
        width: colDescW,
        align: 'left',
      });

    doc.y = headerY + 16;
    doc
      .lineWidth(0.8)
      .strokeColor('#000')
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.y += 6;

    // Linhas da tabela
    for (const it of itens) {
      const ambiente = String(it.nome_ambiente || '-').toUpperCase();
      const descBase = String(it.descricao || '');
      const linhas = descBase
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter(Boolean)
        .map((l: string) => `• ${l}`);
      let descTexto = linhas.length ? linhas.join('\n') : '-';
      const obs = String(it.observacao || '').trim();
      if (obs) {
        descTexto =
          descTexto + (descTexto !== '-' ? '\n' : '') + 'Obs.: ' + obs;
      }

      doc.font('Helvetica-Bold').fontSize(10);
      const hAmb = doc.heightOfString(ambiente, { width: colAmbW });

      doc.font('Helvetica').fontSize(10);
      const hDesc = doc.heightOfString(descTexto, { width: colDescW });

      const rowH = Math.max(hAmb, hDesc);

      if (doc.y + rowH + margemInferior > doc.page.height) {
        doc.addPage();
        // Header aplicado pelo evento pageAdded; reimprime cabeçalho da tabela
        const hY = doc.y;
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#000')
          .text('Item/ ambiente:', left, hY, { width: colAmbW })
          .text('Descritivo:', left + colAmbW, hY, {
            width: colDescW,
            align: 'left',
          });

        doc.y = hY + 16;
        doc
          .lineWidth(0.8)
          .strokeColor('#000')
          .moveTo(left, doc.y)
          .lineTo(right, doc.y)
          .stroke();
        doc.y += 6;
      }

      const baseY = doc.y;

      // Coluna ambiente (centralizado verticalmente)
      doc.font('Helvetica-Bold').fontSize(10).text(ambiente, left, baseY, {
        width: colAmbW,
        align: 'center',
      });

      // Coluna descritivo (bullets)
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(descTexto, left + colAmbW + 6, baseY, {
          width: colDescW - 6,
          align: 'left',
        });

      doc.y = baseY + rowH + 6;

      // Linha separadora
      doc
        .lineWidth(0.4)
        .strokeColor('#CCCCCC')
        .moveTo(left, doc.y)
        .lineTo(right, doc.y)
        .stroke();
      doc.y += 6;
    }

    doc.y += 4;
  }

  /** Garante espaço mínimo antes de iniciar um bloco na página atual. */
  private garantirEspacoPagina(
    doc: any,
    alturaNecessaria: number,
    margemInferior = 60,
  ): void {
    if (doc.y + alturaNecessaria > doc.page.height - margemInferior) {
      doc.addPage();
    }
  }

  /**
   * Desenha texto com quebra de página correta: se o parágrafo inteiro couber na página,
   * garante espaço e desenha; senão usa posição atual (doc.x = left) e desenha em fluxo,
   * para o PDFKit poder quebrar para a próxima página quando necessário.
   */
  private textoComQuebraPagina(
    doc: any,
    texto: string,
    left: number,
    larguraTexto: number,
    margemInferior = 60,
  ): void {
    if (!texto || !String(texto).trim()) return;
    doc.font('Helvetica').fontSize(10);
    const h = doc.heightOfString(texto, { width: larguraTexto });
    const espacoRestante = doc.page.height - margemInferior - doc.y;
    if (h <= espacoRestante) {
      this.garantirEspacoPagina(doc, h, margemInferior);
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(texto, left, doc.y, {
          width: larguraTexto,
          align: 'justify',
        });
    } else {
      this.garantirEspacoPagina(doc, 1, margemInferior);
      doc.x = left;
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(texto, {
          width: larguraTexto,
          align: 'justify',
        });
    }
  }

  private renderCamposAssinatura(
    doc: any,
    left: number,
    right: number,
    larguraTexto: number,
    mapa: Record<string, string>,
  ): void {
    const blocoW = Math.min(260, larguraTexto * 0.6);
    const lineW = blocoW;
    const lineYOffset = 6;
    const spacing = 18;
    const margemInferiorAssinatura = 84; // margem padrão (60) + respiro visual extra
    const razao = mapa.contratada_razao_social || 'CONTRATADA';
    const clienteNome =
      mapa.cliente_razao_social_ou_nome_completo || 'CONTRATANTE';
    const docTipo = mapa.cliente_documento_tipo || 'CPF';
    const docNum = mapa.cliente_documento_numero || '';
    const assinaturaClienteVisivel = mapa.assinatura_cliente_visivel || '';
    const assinaturaClienteImagemPath =
      mapa.assinatura_cliente_imagem_path || '';

    doc.y += spacing;

    const drawCienteBlock = (
      titulo: string,
      linhas: string[],
      assinaturaInfo?: string,
      assinaturaImagemPath?: string,
    ) => {
      const medirAlturaTexto = (
        texto: string,
        font: string,
        size: number,
      ): number => {
        doc.font(font).fontSize(size);
        return doc.heightOfString(texto, { width: blocoW });
      };
      const alturaTitulo = medirAlturaTexto(titulo, 'Helvetica-Bold', 10);
      const alturasLinhas = linhas.map((ln) =>
        medirAlturaTexto(ln, 'Helvetica', 9),
      );
      const temImagemAssinatura =
        !!assinaturaImagemPath && fs.existsSync(assinaturaImagemPath);
      const alturaImagemAssinatura = temImagemAssinatura ? 34 : 0;
      const alturaAssinatura =
        assinaturaInfo && String(assinaturaInfo).trim()
          ? medirAlturaTexto(
              String(assinaturaInfo).trim(),
              'Helvetica-Oblique',
              8,
            )
          : 0;
      const alturaMinimaSemOrfao =
        alturaTitulo +
        2 +
        (alturaImagemAssinatura > 0 ? alturaImagemAssinatura + 2 : 0) +
        (lineYOffset + 8) +
        (alturasLinhas[0] ?? 0) +
        2;
      const alturaTotalBloco =
        alturaTitulo +
        2 +
        (alturaImagemAssinatura > 0 ? alturaImagemAssinatura + 2 : 0) +
        (lineYOffset + 8) +
        (alturaAssinatura > 0 ? alturaAssinatura + 6 : 0) +
        (alturaImagemAssinatura > 0 ? alturaImagemAssinatura + 4 : 0) +
        alturasLinhas.reduce((acc, h) => acc + h + 2, 0) +
        spacing;

      // Evita "título órfão": só inicia o bloco se couber ao menos título + primeira linha.
      this.garantirEspacoPagina(
        doc,
        alturaMinimaSemOrfao,
        margemInferiorAssinatura,
      );
      this.garantirEspacoPagina(
        doc,
        alturaTotalBloco,
        margemInferiorAssinatura,
      );
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#000')
        .text(titulo, left, doc.y, { width: larguraTexto });
      doc.y += doc.currentLineHeight() + 2;
      if (alturaAssinatura > 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor('#4b5563')
          .text(String(assinaturaInfo).trim(), left, doc.y, { width: blocoW });
        doc.y += doc.currentLineHeight() + 4;
      }
      if (temImagemAssinatura) {
        doc.image(String(assinaturaImagemPath), left, doc.y, {
          fit: [lineW, 30],
          align: 'left',
        });
        doc.y += 34;
      }
      doc
        .lineWidth(0.5)
        .strokeColor('#000')
        .moveTo(left, doc.y + lineYOffset)
        .lineTo(left + lineW, doc.y + lineYOffset)
        .stroke();
      doc.y += lineYOffset + 8;
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      for (const ln of linhas) {
        doc.text(ln, left, doc.y, { width: blocoW });
        doc.y += doc.currentLineHeight() + 2;
      }
      doc.y += spacing;
    };

    // Bloco CONTRATADA (empresa): Ciente + imagem da assinatura do responsável (se houver) + linha para assinatura
    const assinaturaResponsavelPath = mapa.assinatura_responsavel_imagem_path || '';
    const linhasContratada = [
      `CONTRATADA: ${razao}`,
    ].filter(Boolean);
    drawCienteBlock(
      'Ciente:',
      linhasContratada,
      undefined,
      assinaturaResponsavelPath && fs.existsSync(assinaturaResponsavelPath)
        ? assinaturaResponsavelPath
        : undefined,
    );
    const gapEntreAssinaturas = 14;
    this.garantirEspacoPagina(
      doc,
      gapEntreAssinaturas + 20,
      margemInferiorAssinatura,
    );
    doc.y += gapEntreAssinaturas;

    // Bloco CONTRATANTE (cliente): Ciente + linha para assinatura + nome e documento
    drawCienteBlock(
      'Ciente:',
      [`CONTRATANTE: ${clienteNome}`, `${docTipo}: ${docNum}`].filter(Boolean),
      assinaturaClienteVisivel,
      assinaturaClienteImagemPath,
    );

    const drawLinhaTestemunha = (label: string) => {
      const alturaLabel = doc
        .font('Helvetica')
        .fontSize(9)
        .heightOfString(label, { width: larguraTexto });
      const alturaMinimaSemOrfao = alturaLabel + 2 + (lineYOffset + 14);
      this.garantirEspacoPagina(
        doc,
        alturaMinimaSemOrfao,
        margemInferiorAssinatura,
      );
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#333')
        .text(label, left, doc.y, { width: larguraTexto });
      doc.y += doc.currentLineHeight() + 2;
      doc
        .lineWidth(0.5)
        .strokeColor('#000')
        .moveTo(left, doc.y + lineYOffset)
        .lineTo(left + lineW, doc.y + lineYOffset)
        .stroke();
      doc.y += lineYOffset + 14;
    };

    drawLinhaTestemunha('Testemunha 1');
    drawLinhaTestemunha('Testemunha 2');
  }

  private resumirUserAgent(userAgent?: string | null): string {
    const ua = String(userAgent || '').trim();
    if (!ua) return 'Navegador web';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac os x/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Navegador web';
  }

  private montarResumoAssinaturaClientePdf(params: {
    dataHora?: Date | null;
    ip?: string | null;
    userAgent?: string | null;
    timezone?: string | null;
    hashDocumento?: string | null;
  }): string {
    const dataFonte = params.dataHora ? new Date(params.dataHora) : new Date();
    const dataHora = Number.isNaN(dataFonte.getTime())
      ? new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : dataFonte.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const ip = String(params.ip || '').trim() || 'não identificado';
    const tz = String(params.timezone || '').trim() || 'America/Sao_Paulo';
    const dispositivo = this.resumirUserAgent(params.userAgent);
    const hashCurto = String(params.hashDocumento || '').trim()
      ? `${String(params.hashDocumento).trim().slice(0, 16)}...`
      : 'não disponível';
    return `Assinatura eletrônica do contratante registrada em ${dataHora} (America/Sao_Paulo). IP: ${ip}. Dispositivo: ${dispositivo}. Fuso informado: ${tz}. Hash do documento: ${hashCurto}`;
  }

  private async gerarContratoPdfBuffer(contratoId: number): Promise<Buffer> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      include: {
        cliente: true,
        venda: {
          include: {
            itens: true,
            pagamentos: true,
            formas_pagamento: true,
            orcamento: { include: { itens: true } },
          },
        },
      },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');

    const modulos =
      await this.clausulasService.buscarOuCriarPorTipo('CONTRATO');
    const modulosOrdenados = (() => {
      const lista = Array.isArray(modulos) ? [...modulos] : [];
      const idxClausula11 = lista.findIndex(
        (m: any) =>
          String(m?.modulo_key || '').toUpperCase() === 'ASSINATURA_ELETRONICA',
      );
      if (idxClausula11 <= -1) return lista;
      const [clausula11] = lista.splice(idxClausula11, 1);
      return [...lista, clausula11];
    })();

    const cliente: any = contrato.cliente || {};
    const venda: any = contrato.venda || {};
    const orc: any = venda.orcamento || {};

    const nomeCliente =
      cliente.nome_completo ||
      cliente.razao_social ||
      cliente.nome ||
      `CLIENTE #${cliente.id}`;
    const docTipo = cliente.cnpj ? 'CNPJ' : 'CPF';
    const docNum = cliente.cnpj || cliente.cpf || '';
    const docNumFormatado =
      docTipo === 'CNPJ' ? this.maskCnpj(docNum) : this.maskCpf(docNum);

    const endPartes = [
      cliente.endereco,
      cliente.numero ? `Nº ${cliente.numero}` : null,
      cliente.complemento ? `(${cliente.complemento})` : null,
      cliente.bairro ? `Bairro: ${cliente.bairro}` : null,
      cliente.cidade
        ? `${cliente.cidade}${cliente.estado ? ' - ' + cliente.estado : ''}`
        : null,
      cliente.cep ? `CEP: ${this.maskCep(cliente.cep)}` : null,
    ].filter(Boolean);

    const enderecoCompleto = endPartes.join(' - ') || '-';

    // Valor total do contrato = total que o cliente vai pagar (valor_vendido), para evitar questionamento jurídico
    const valorTotal = Number(
      contrato.valor ||
      venda.valor_vendido ||
      venda.valor_total ||
      (venda.valor_base_contrato != null ? Number(venda.valor_base_contrato) : null) ||
      0,
    );
    const valorTotalNumerico = valorTotal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const TZ_BR = 'America/Sao_Paulo';
    /** Evita dia errado: datas "só dia" (meia-noite UTC) viram dia anterior no Brasil; normaliza para meio-dia UTC. */
    const normalizarDataParaExibicao = (dt: Date): Date => {
      if (
        dt.getUTCHours() === 0 &&
        dt.getUTCMinutes() === 0 &&
        dt.getUTCSeconds() === 0
      ) {
        const d = new Date(dt);
        d.setUTCHours(12, 0, 0, 0);
        return d;
      }
      return dt;
    };
    const formatarDataLocal = (d: Date | string | null | undefined): string => {
      if (!d) return '';
      try {
        let dt: Date;
        if (typeof d === 'string') {
          const s = String(d).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const [y, m, day] = s.split('T')[0].split('-').map(Number);
            dt = new Date(Date.UTC(y, m - 1, day, 12, 0, 0, 0));
          } else {
            dt = new Date(d);
          }
        } else {
          dt = d;
        }
        if (Number.isNaN(dt.getTime())) return '';
        dt = normalizarDataParaExibicao(dt);
        return dt.toLocaleDateString('pt-BR', { timeZone: TZ_BR });
      } catch {
        return '';
      }
    };

    const LABEL_FORMA_PAGAMENTO: Record<string, string> = {
      CREDITO: 'Cartão de crédito',
      DEBITO: 'Cartão de débito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
      DINHEIRO: 'Dinheiro',
      CHEQUE: 'Cheque',
      TRANSFERENCIA: 'Transferência bancária',
    };
    const pagamentos = Array.isArray(venda.pagamentos) ? venda.pagamentos : [];
    const formasPagamento = Array.isArray((venda as any).formas_pagamento)
      ? (venda as any).formas_pagamento
      : [];
    const labelForma = (chave: string) =>
      LABEL_FORMA_PAGAMENTO[String(chave || '').toUpperCase()] ||
      String(chave || '').toUpperCase();
    // Valor total do contrato (preço certo e ajustado) – sem juros quando há valor_base_contrato
    const valorTotalContratoStr = valorTotal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    // Agrupa por forma de pagamento e monta descrição
    const valorTotalPagamentos = (pagamentos as any[]).reduce(
      (acc, p) => acc + Number(p?.valor ?? 0),
      0,
    );
    const descFormaPagamento = (() => {
      const temJurosAposDescricao = (): boolean => {
        if (pagamentos.length === 0) return false;
        const porForma = new Map<string, { total: number; qtd: number }>();
        for (const p of pagamentos as any[]) {
          const chave = String(p?.forma_pagamento_chave ?? '').toUpperCase() || 'OUTRO';
          const valor = Number(p?.valor ?? 0);
          const atual = porForma.get(chave) || { total: 0, qtd: 0 };
          atual.total += valor;
          atual.qtd += 1;
          porForma.set(chave, atual);
        }
        const credito = porForma.get('CREDITO');
        const parceladoCredito = credito && credito.qtd > 1;
        return valorTotal > valorTotalPagamentos + 0.01 || !!parceladoCredito;
      };
      const aplicarValorTotalCorreto = (texto: string): string => {
        const fraseCorreta = `Valor total: ${valorTotalContratoStr}`;
        const resultado = texto.replace(
          /\bValor total\b(?:\s*\(com juros\))?\s*:\s*R\$\s*[\d.,]+/gi,
          fraseCorreta,
        );
        if (resultado === texto && /Valor total/i.test(texto)) {
          return texto.replace(
            /[,.]?\s*Valor total\s*(?:\(com juros\))?\s*:?\s*R\$\s*[\d.,]+/gi,
            `. ${fraseCorreta}`,
          ).replace(/\.\s*\./g, '.');
        }
        return resultado;
      };
      if (contrato.descricao?.trim()) {
        return aplicarValorTotalCorreto(contrato.descricao.trim());
      }
      // Usar vendas_formas_pagamento quando existir: mostrar valores JÁ COM JUROS (soma de vendas_pagamentos por forma)
      if (formasPagamento.length > 0 && pagamentos.length > 0) {
        const totalPorForma = new Map<string, { total: number; qtd: number }>();
        for (const p of pagamentos as any[]) {
          const chave = String(p?.forma_pagamento_chave ?? '').toUpperCase() || 'OUTRO';
          const valor = Number(p?.valor ?? 0);
          const atual = totalPorForma.get(chave) || { total: 0, qtd: 0 };
          atual.total += valor;
          atual.qtd += 1;
          totalPorForma.set(chave, atual);
        }
        const partes: string[] = [];
        for (const f of formasPagamento as any[]) {
          const chave = String(f?.forma_pagamento_chave ?? '').toUpperCase();
          const label = labelForma(chave);
          const n = Math.max(1, Number(f?.quantidade_parcelas) || 1);
          const comJuros = Boolean(f?.com_juros);
          const dados = totalPorForma.get(chave);
          const totalReal = dados ? dados.total : 0;
          const totalFmt = totalReal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });
          if (n > 1) {
            partes.push(
              `${label} em ${n}x, total ${totalFmt}${comJuros ? ' (com juros)' : ''}`,
            );
          } else {
            partes.push(`${label} à vista: ${totalFmt}`);
          }
        }
        return partes.length
          ? `${partes.join('. ')}. Valor total: ${valorTotalContratoStr}`
          : valorTotalContratoStr;
      }
      if (formasPagamento.length > 0) {
        const partes: string[] = [];
        for (const f of formasPagamento as any[]) {
          const chave = String(f?.forma_pagamento_chave ?? '').toUpperCase();
          const label = labelForma(chave);
          const valorBase = Number(f?.valor_base ?? 0);
          const valorFmt = valorBase.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });
          const n = Math.max(1, Number(f?.quantidade_parcelas) || 1);
          const comJuros = Boolean(f?.com_juros);
          if (n > 1) {
            partes.push(
              `${label} em ${n}x, valor de ${valorFmt}${comJuros ? ' (com juros)' : ''}`,
            );
          } else {
            partes.push(`${label} à vista: ${valorFmt}`);
          }
        }
        return partes.length
          ? `${partes.join('. ')}. Valor total: ${valorTotalContratoStr}`
          : valorTotalContratoStr;
      }
      if (pagamentos.length === 0) return '';
      const porForma = new Map<string, { total: number; qtd: number }>();
      for (const p of pagamentos as any[]) {
        const chave = String(p?.forma_pagamento_chave ?? '').toUpperCase() || 'OUTRO';
        const valor = Number(p?.valor ?? 0);
        const atual = porForma.get(chave) || { total: 0, qtd: 0 };
        atual.total += valor;
        atual.qtd += 1;
        porForma.set(chave, atual);
      }
      // Sempre mostra o total por forma e "Valor total: R$ X" (sem mencionar juros)
      const partes: string[] = [];
      for (const [chave, { total, qtd }] of porForma) {
        const label = labelForma(chave);
        const totalFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (qtd > 1) {
          partes.push(`${label} em ${qtd} parcela(s), total ${totalFmt}`);
        } else {
          partes.push(`${label} à vista: ${totalFmt}`);
        }
      }
      const texto = partes.join('. ');
      return texto ? `${texto}. Valor total: ${valorTotalContratoStr}` : valorTotalContratoStr;
    })();

    const hoje = new Date();
    const dataAss = hoje.toLocaleDateString('pt-BR', { timeZone: TZ_BR });
    const dataHoraAss = hoje.toLocaleString('pt-BR', { timeZone: TZ_BR });
    const dia = hoje.toLocaleString('pt-BR', {
      timeZone: TZ_BR,
      day: 'numeric',
    });
    const mes = hoje.toLocaleString('pt-BR', {
      timeZone: TZ_BR,
      month: 'long',
    });
    const ano = hoje.toLocaleString('pt-BR', {
      timeZone: TZ_BR,
      year: 'numeric',
    });
    const dataPorExtenso = `${dia} de ${mes} de ${ano}.`;

    const empresa = await this.prisma.empresa.findUnique({ where: { id: 1 } });

    const razaoSocial = empresa?.razao_social || 'A Casa Móveis Planejados';
    const cnpj = empresa?.cnpj || '28.638.791/0001-07';
    const enderecoEmpresaPartes = [
      empresa?.logradouro,
      empresa?.numero ? `Nº ${empresa.numero}` : null,
      empresa?.bairro ? `Bairro: ${empresa.bairro}` : null,
      empresa?.cidade
        ? `${empresa.cidade}${empresa.uf ? ' - ' + empresa.uf : ''}`
        : null,
    ].filter(Boolean);
    const enderecoEmpresa =
      enderecoEmpresaPartes.length > 0
        ? enderecoEmpresaPartes.join(' - ')
        : 'Rua Javari, 3358 - Ribeirão Preto - SP';

    const clienteIe = cliente?.ie ?? '';
    const clienteIeFrase =
      docTipo === 'CNPJ' && clienteIe
        ? `, inscrito na Inscrição Estadual sob o nº ${String(clienteIe).trim()}`
        : '';
    const ultimaAssinatura = await this.prisma.assinaturas_log.findFirst({
      where: { contrato_id: contrato.id },
      orderBy: { data_hora: 'desc' },
      select: {
        data_hora: true,
        ip_address: true,
        dispositivo: true,
        hash_documento: true,
        metodo_verificacao: true,
      },
    });
    const timezoneExtraida = (() => {
      const metodo = String(ultimaAssinatura?.metodo_verificacao || '');
      const match = metodo.match(/Fuso:\s*([^|]+)/i);
      return match?.[1]?.trim() || null;
    })();
    const assinaturaClienteArquivo = await this.prisma.arquivos.findUnique({
      where: {
        owner_type_owner_id_slot_key: {
          owner_type: 'CONTRATO',
          owner_id: contrato.id,
          slot_key: 'ASSINATURA_CLIENTE',
        },
      },
      select: { url: true },
    });
    const assinaturaClienteImagemPath = assinaturaClienteArquivo?.url
      ? path.join(
          process.cwd(),
          String(assinaturaClienteArquivo.url).replace(/^\//, ''),
        )
      : '';
    const temAssinaturaClienteImagem =
      !!assinaturaClienteImagemPath &&
      fs.existsSync(assinaturaClienteImagemPath);

    // Assinatura do Responsável (empresa) — variável para PDFs
    const assinaturaResponsavelArquivo = await this.prisma.arquivos.findFirst({
      where: {
        owner_type: 'EMPRESA',
        owner_id: 1,
        slot_key: 'ASSINATURA_RESPONSAVEL',
      },
      select: { url: true },
    });
    const assinaturaResponsavelImagemPath = assinaturaResponsavelArquivo?.url
      ? path.join(
          process.cwd(),
          String(assinaturaResponsavelArquivo.url).replace(/^\//, ''),
        )
      : '';
    const temAssinaturaResponsavelImagem =
      !!assinaturaResponsavelImagemPath &&
      fs.existsSync(assinaturaResponsavelImagemPath);

    const assinaturaClienteVisivel = ultimaAssinatura
      ? this.montarResumoAssinaturaClientePdf({
          dataHora: ultimaAssinatura.data_hora,
          ip: ultimaAssinatura.ip_address,
          userAgent: ultimaAssinatura.dispositivo,
          timezone: timezoneExtraida,
          hashDocumento: ultimaAssinatura.hash_documento,
        })
      : temAssinaturaClienteImagem || contrato.data_assinatura
        ? this.montarResumoAssinaturaClientePdf({
            dataHora: contrato.data_assinatura || new Date(),
            timezone: TZ_BR,
          })
        : '';

    const mapa: Record<string, string> = {
      cliente_razao_social_ou_nome_completo: String(nomeCliente),
      cliente_documento_tipo: docTipo,
      cliente_documento_numero: String(docNumFormatado || docNum),
      cliente_ie: clienteIe,
      cliente_ie_frase: clienteIeFrase,
      cliente_endereco_completo: enderecoCompleto,
      orcamento_id: orc?.id ? String(orc.id) : '',
      venda_id: venda?.id ? String(venda.id) : '',
      valor_total_numerico: valorTotalNumerico,
      valor_total_extenso: valorTotalNumerico,
      valor_total_por_extenso: this.valorPorExtensoReais(valorTotal),
      lista_itens_venda: '', // itens só na tabela abaixo (evita duplicar com a tabela Item/ambiente e Descritivo)
      descricao_forma_pagamento_contrato: descFormaPagamento,
      data_venda: venda?.data_venda ? formatarDataLocal(venda.data_venda) : '',
      data_prazo_entrega: contrato.data_fim
        ? formatarDataLocal(contrato.data_fim)
        : '',
      data_prazo_entrega_por_extenso: contrato.data_fim
        ? (() => {
            try {
              let d = new Date(contrato.data_fim);
              if (Number.isNaN(d.getTime())) return '';
              d = normalizarDataParaExibicao(d);
              return d.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: TZ_BR,
              });
            } catch {
              return '';
            }
          })()
        : '',
      cidade_foro: cliente.cidade || empresa?.cidade || 'Ribeirão Preto',
      estado_foro: cliente.estado || empresa?.uf || 'SP',
      cidade_data_assinatura: `${
        cliente.cidade || empresa?.cidade || 'Ribeirão Preto'
      }, ${dataPorExtenso}`,
      contratada_razao_social: razaoSocial,
      contratada_cnpj: this.maskCnpj(empresa?.cnpj ?? cnpj),
      contratada_ie: empresa?.ie ?? '',
      contratada_ie_frase: empresa?.ie
        ? `, inscrita na Inscrição Estadual sob o nº ${String(empresa.ie).trim()}`
        : '',
      contratada_endereco_completo: enderecoEmpresa,
      // Dados para pagamento (cadastro da empresa)
      contratada_pix: empresa?.pix ?? '',
      contratada_banco_titular: empresa?.banco_titular ?? '',
      contratada_banco_nome: empresa?.banco_nome ?? '',
      contratada_banco_agencia: empresa?.banco_agencia ?? '',
      contratada_banco_conta: empresa?.banco_conta ?? '',
      contratada_dados_pagamento: [
        empresa?.pix
          ? `PIX CNPJ ${this.maskCnpj(empresa?.cnpj ?? '')} ${empresa?.razao_social || empresa?.banco_titular || ''}`
          : null,
        empresa?.banco_nome && empresa?.banco_agencia && empresa?.banco_conta
          ? `transferência bancária ${empresa.banco_nome} Agência ${empresa.banco_agencia} Conta ${empresa.banco_conta}${empresa?.razao_social ? ' – ' + empresa.razao_social : empresa?.banco_titular ? ' – ' + empresa.banco_titular : ''}`
          : null,
      ]
        .filter(Boolean)
        .join(' ou '),
      prazo_garantia_anos: '5',
      valor_revisao_base: 'R$ 250,00',
      valor_armazenagem_dia: 'R$ 100,00',
      acabamento_interno_padrao: 'Branco TX (MDF BP 15mm)',
      assinatura_digital_visivel: '', // Removido: não usar mais assinatura eletrônica no PDF
      assinatura_cliente_visivel: '', // Apenas linha para assinatura física; sem registro eletrônico no PDF
      assinatura_cliente_imagem_path: '',
      // Variável para exibir imagem da assinatura do responsável em PDFs
      assinatura_responsavel_imagem_path: temAssinaturaResponsavelImagem
        ? assinaturaResponsavelImagemPath
        : '',
    };

    const doc = new PDFKitDoc({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    const pdfGerado = await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Garante que toda nova página (incluindo por quebra de texto) tenha o header PNG.
      doc.on('pageAdded', () => {
        const headerBottom = renderHeaderA4Png(doc as any) + 20;
        doc.y = headerBottom;
      });

      try {
        const left = 40;
        const right = doc.page.width - 40;
        const larguraTexto = right - left;

        const startY = renderHeaderA4Png(doc as any);
        doc.y = startY + 20;

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .text(
            'CONTRATO DE COMPRA E VENDA DE MERCADORIAS E PRESTAÇÃO DE SERVIÇOS',
            left,
            doc.y,
            {
              width: larguraTexto,
              align: 'center',
            },
          );
        doc.y += 24;

        let jaRenderizouAlgumaClausula = false;
        const clausulasComQuebraAntes = new Set([
          'PRECO_CONDICOES', // Cláusula 2 (estabiliza após a tabela da cláusula 1)
          'CESSAO_IMAGEM', // Cláusula 9 (evita quebrar bloco no limite inferior do layout)
          'ASSINATURA_ELETRONICA', // Cláusula 11 (fecha junto ao bloco de assinaturas)
        ]);
        for (const mod of modulosOrdenados) {
          const titulo = String(mod.titulo || '').trim();
          const key = String((mod as any).modulo_key || '').toUpperCase();
          const textoRaw =
            String(mod.texto || '').trim() ||
            this.DEFAULT_TEXTOS_CONTRATO[key] ||
            '';
          let textoBruto = this.substituirPlaceholders(
            String(mod.texto || ''),
            mapa,
          );
          if (!textoBruto && this.DEFAULT_TEXTOS_CONTRATO[key]) {
            textoBruto = this.substituirPlaceholders(
              this.DEFAULT_TEXTOS_CONTRATO[key],
              mapa,
            );
          }
          const texto = String(textoBruto || '').trim();
          if (!titulo && !texto && key !== 'OBJETO') continue;

          if (clausulasComQuebraAntes.has(key) && jaRenderizouAlgumaClausula) {
            // Cláusulas estratégicas iniciam em nova página para padronizar alinhamento visual.
            doc.addPage();
          }

          const alturaMinimaClausula = key === 'CESSAO_IMAGEM' ? 140 : 80;
          const margemInferiorClausula = key === 'CESSAO_IMAGEM' ? 96 : 60;
          this.garantirEspacoPagina(
            doc,
            alturaMinimaClausula,
            margemInferiorClausula,
          );

          if (titulo) {
            doc.font('Helvetica-Bold').fontSize(11).text(titulo, left, doc.y, {
              width: larguraTexto,
              align: 'center',
            });
            doc.y += doc.currentLineHeight() + 4;
          }

          if (texto || key === 'OBJETO') {
            if (key === 'OBJETO') {
              // Força a tabela logo após o bloco inicial (endereçamento), antes do § Segundo.
              const brutoObjeto = String(texto || '').trim();
              const semPlaceholder = brutoObjeto
                .replace(/\[\[lista_itens_venda\]\]/gi, '')
                .replace(/^\s*Item\/\s*ambiente:\s*Descritivo:\s*$/gim, '')
                .trim();
              const matchAposEndereco = semPlaceholder.match(
                /O\s+CONTRATANTE\s+declara-se/i,
              );
              const idxAposEndereco = matchAposEndereco?.index ?? -1;
              const matchSegundo = semPlaceholder.match(/§\s*Segundo/i);
              const idxSegundo = matchSegundo?.index ?? -1;
              const idxCorte =
                idxAposEndereco > 0 ? idxAposEndereco : idxSegundo;
              const parteAntesTabela =
                idxCorte > 0
                  ? semPlaceholder.slice(0, idxCorte).trim()
                  : semPlaceholder;
              const parteDepoisTabela =
                idxCorte > 0 ? semPlaceholder.slice(idxCorte).trim() : '';

              if (parteAntesTabela) {
                this.textoComQuebraPagina(
                  doc,
                  parteAntesTabela,
                  left,
                  larguraTexto,
                  60,
                );
                doc.y += 4;
              }

              this.renderTabelaItensVenda(doc, venda, left, right);

              if (parteDepoisTabela) {
                doc.y += 4;
                this.textoComQuebraPagina(
                  doc,
                  parteDepoisTabela,
                  left,
                  larguraTexto,
                  60,
                );
                doc.y += 10;
              }
            } else {
              this.textoComQuebraPagina(doc, texto, left, larguraTexto, 60);
              doc.y += 10;
            }
            jaRenderizouAlgumaClausula = true;
          }

          doc.y += 4;
        }

        // A quebra das assinaturas é controlada internamente por bloco.
        this.renderCamposAssinatura(doc, left, right, larguraTexto, mapa);

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
    return this.assinarPdfComA1SeConfigurado(pdfGerado);
  }

  async gerarPdfESalvar(contratoId: number) {
    const pdfBuffer = await this.gerarContratoPdfBuffer(contratoId);

    const dir = path.join(process.cwd(), 'uploads', 'relatorios');
    fs.mkdirSync(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = randomBytes(6).toString('hex');
    const filename = `contrato_${contratoId}_${stamp}_${rand}.pdf`;

    fs.writeFileSync(path.join(dir, filename), pdfBuffer);

    const url = `/uploads/relatorios/${filename}`;

    const arquivo = await this.prisma.arquivos.create({
      data: {
        owner_type: 'CONTRATO',
        owner_id: contratoId,
        categoria: 'RELATORIO',
        slot_key: null,
        url,
        filename,
        nome: `CONTRATO #${contratoId}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      },
      select: { id: true },
    });

    return { arquivoId: arquivo.id };
  }

  private async salvarPdfContratoComSlot(params: {
    contratoId: number;
    pdfBuffer: Buffer;
    slotKey: string;
    categoria: string;
    nomeArquivo: string;
  }): Promise<{ id: number }> {
    const slotKey = String(params.slotKey || '')
      .trim()
      .toUpperCase();
    const categoria = String(params.categoria || '')
      .trim()
      .toUpperCase();
    if (!slotKey)
      throw new BadRequestException(
        'slotKey do arquivo de contrato é obrigatório.',
      );
    if (!categoria)
      throw new BadRequestException(
        'categoria do arquivo de contrato é obrigatória.',
      );

    const dir = path.join(process.cwd(), 'uploads', 'relatorios');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = randomBytes(6).toString('hex');
    const filename = `contrato_${params.contratoId}_${slotKey.toLowerCase()}_${stamp}_${rand}.pdf`;
    fs.writeFileSync(path.join(dir, filename), params.pdfBuffer);
    const url = `/uploads/relatorios/${filename}`;

    const existente = await this.prisma.arquivos.findUnique({
      where: {
        owner_type_owner_id_slot_key: {
          owner_type: 'CONTRATO',
          owner_id: params.contratoId,
          slot_key: slotKey,
        },
      },
    });

    const salvo = await this.prisma.arquivos.upsert({
      where: {
        owner_type_owner_id_slot_key: {
          owner_type: 'CONTRATO',
          owner_id: params.contratoId,
          slot_key: slotKey,
        },
      },
      create: {
        owner_type: 'CONTRATO',
        owner_id: params.contratoId,
        categoria,
        slot_key: slotKey,
        url,
        filename,
        nome: params.nomeArquivo,
        mime_type: 'application/pdf',
        tamanho: params.pdfBuffer.length,
      },
      update: {
        categoria,
        url,
        filename,
        nome: params.nomeArquivo,
        mime_type: 'application/pdf',
        tamanho: params.pdfBuffer.length,
      },
      select: { id: true },
    });

    if (existente?.url && existente.url !== url) {
      try {
        const relOld = existente.url.replace(/^\//, '');
        const absOld = path.join(process.cwd(), relOld);
        if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
      } catch {}
    }

    return salvo;
  }

  /**
   * Retorna o buffer do PDF do contrato para visualização.
   * Se existir o PDF já assinado pelo cliente (CONTRATO_ASSINADO_CLIENTE), retorna esse arquivo.
   * Caso contrário, gera o PDF atual (evita confusão: só mostra o que o cliente assinou quando houver).
   */
  async obterPdfBuffer(contratoId: number): Promise<Buffer> {
    const assinado = await this.prisma.arquivos.findUnique({
      where: {
        owner_type_owner_id_slot_key: {
          owner_type: 'CONTRATO',
          owner_id: contratoId,
          slot_key: 'CONTRATO_ASSINADO_CLIENTE',
        },
      },
      select: { url: true },
    });
    if (assinado?.url) {
      const rel = String(assinado.url).replace(/^\//, '');
      const abs = path.join(process.cwd(), rel);
      if (fs.existsSync(abs)) {
        return fs.readFileSync(abs);
      }
    }
    return this.gerarContratoPdfBuffer(contratoId);
  }

  /**
   * Gera um link público temporário (24h) para download do PDF do contrato.
   * Útil para enviar por WhatsApp/e-mail manualmente.
   */
  /** Gera token curto (8 caracteres) para URL. */
  private gerarShortToken(): string {
    return randomBytes(4).toString('hex');
  }

  /**
   * Resolve token da URL: se for token curto (até 12 chars, sem ponto), busca no banco;
   * senão trata como JWT. Retorna contratoId e o token a usar na URL (para montar linkPdf).
   */
  private async resolveTokenPublico(
    token: string,
  ): Promise<{ contratoId: number; tokenParaUrl: string }> {
    const isShort = token.length <= 12 && !token.includes('.');
    if (isShort) {
      const now = new Date();
      const row = await this.prisma.contratos_link_publico.findFirst({
        where: { short_token: token, expira_em: { gt: now } },
        select: { contrato_id: true },
      });
      if (!row) throw new BadRequestException('Link inválido ou expirado.');
      return { contratoId: row.contrato_id, tokenParaUrl: token };
    }
    const payload = await this.jwt.verifyAsync(token).catch(() => null);
    if (!payload || payload?.purpose !== 'pdf-link' || !payload?.contratoId) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    return { contratoId: payload.contratoId, tokenParaUrl: token };
  }

  /**
   * Inclui contrato assinado via link público (token). Marca como vigente e grava PDF no slot CONTRATO_ASSINADO_CLIENTE.
   */
  async incluirContratoAssinadoPorToken(
    token: string,
    pdfBuffer?: Buffer,
  ): Promise<{ success: boolean; status: string }> {
    const { contratoId } = await this.resolveTokenPublico(token);
    return this.marcarVigenteAssinaturaPresencial(contratoId, pdfBuffer);
  }

  async obterLinkPublicoPdf(
    contratoId: number,
    baseUrl: string,
  ): Promise<{
    link: string;
    linkPdf: string;
    token: string;
    expiraEm: string;
  }> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: { id: true, status: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let shortToken = this.gerarShortToken();
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        await this.prisma.contratos_link_publico.create({
          data: {
            short_token: shortToken,
            contrato_id: contratoId,
            expira_em: expiraEm,
          },
        });
        break;
      } catch (e: any) {
        if (e?.code === 'P2002' && tentativa < 4) {
          shortToken = this.gerarShortToken();
          continue;
        }
        throw e;
      }
    }
    const urlBase = (baseUrl || '').replace(/\/+$/, '');
    const linkPdf = `${urlBase}/api/contratos-publico/${shortToken}/pdf`;
    // Sempre retorna apenas o link direto do PDF (sem subdomínio de aceite/assinatura).
    const link = linkPdf;
    return {
      link,
      linkPdf,
      token: shortToken,
      expiraEm: expiraEm.toISOString(),
    };
  }

  /**
   * Envia o link do contrato por e-mail usando o SMTP configurado no .env.
   * O e-mail é enviado automaticamente pelo sistema (não abre o cliente de e-mail).
   */
  async enviarContratoPorEmail(
    contratoId: number,
    baseUrl: string,
  ): Promise<{ ok: true }> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      include: { cliente: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const cliente = contrato.cliente as any;
    const email = (cliente?.email ?? cliente?.email_secundario ?? '').trim();
    if (!email)
      throw new BadRequestException('Cliente não possui e-mail cadastrado.');
    const { link } = await this.obterLinkPublicoPdf(contratoId, baseUrl);
    const nomeCliente =
      cliente?.nome_completo ||
      cliente?.razao_social ||
      cliente?.nome ||
      'Cliente';
    await this.mail.enviarContratoLink(email, nomeCliente, link);
    return { ok: true };
  }

  /**
   * Valida o token do link público e retorna o buffer do PDF (rota pública, sem auth).
   */
  async getPdfBufferPorTokenPublico(
    token: string,
  ): Promise<{ buffer: Buffer; numero: string }> {
    const { contratoId } = await this.resolveTokenPublico(token);
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: { id: true, numero: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const buffer = await this.gerarContratoPdfBuffer(contrato.id);
    return { buffer, numero: String(contrato.numero || contrato.id) };
  }

  /**
   * Retorna informações do contrato para a página de aceite (rota pública).
   */
  async getInfoPorTokenPublico(
    token: string,
    baseUrl: string,
  ): Promise<{
    numero: string;
    nomeCliente: string;
    linkPdf: string;
    status: string;
    podeAssinar: boolean;
    dataAssinatura: string | null;
    assinaturaClienteRegistrada: boolean;
    dataAssinaturaCliente: string | null;
  }> {
    const { contratoId, tokenParaUrl } = await this.resolveTokenPublico(token);
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      include: { cliente: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const nomeCliente =
      (contrato.cliente as any)?.nome_completo ||
      (contrato.cliente as any)?.razao_social ||
      'Contratante';
    const urlBase = (baseUrl || '').replace(/\/+$/, '');
    const linkPdf = `${urlBase}/api/contratos-publico/${tokenParaUrl}/pdf`;
    const status = String(contrato.status || '');
    const statusUpper = status.toUpperCase();
    const assinaturaCliente = await this.prisma.assinaturas_log.findFirst({
      where: {
        contrato_id: contrato.id,
        OR: [
          { metodo_verificacao: { contains: 'portal seguro' } },
          { metodo_verificacao: { contains: 'Link WhatsApp/SMS' } },
        ],
      },
      orderBy: { data_hora: 'desc' },
      select: { data_hora: true },
    });
    const assinaturaClienteRegistrada = !!assinaturaCliente;
    const podeAssinar =
      statusUpper !== 'CANCELADO' &&
      statusUpper !== 'ENCERRADO' &&
      !assinaturaClienteRegistrada;
    return {
      numero: String(contrato.numero || contrato.id),
      nomeCliente,
      linkPdf,
      status,
      podeAssinar,
      dataAssinatura: contrato.data_assinatura
        ? contrato.data_assinatura.toISOString()
        : null,
      assinaturaClienteRegistrada,
      dataAssinaturaCliente: assinaturaCliente?.data_hora
        ? assinaturaCliente.data_hora.toISOString()
        : null,
    };
  }

  /**
   * Registra o aceite do contrato (rota pública). Grava em assinaturas_log e atualiza status para VIGENTE.
   */
  async registrarAceite(
    token: string,
    evidencias: {
      ipAddress?: string;
      userAgent?: string;
      timezone?: string;
      acceptanceLocalTime?: string;
      deviceLabel?: string;
      screen?: string;
    },
  ): Promise<{ success: true; numero: string; jaAssinado?: boolean }> {
    const { contratoId } = await this.resolveTokenPublico(token);
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: {
        id: true,
        numero: true,
        status: true,
        venda_id: true,
        cliente_id: true,
      },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    const statusAtual = String(contrato.status || '').toUpperCase();
    const assinaturaClienteExistente =
      await this.prisma.assinaturas_log.findFirst({
        where: {
          contrato_id: contrato.id,
          OR: [
            { metodo_verificacao: { contains: 'portal seguro' } },
            { metodo_verificacao: { contains: 'Link WhatsApp/SMS' } },
          ],
        },
        select: { id: true },
      });
    if (statusAtual === 'VIGENTE' && assinaturaClienteExistente) {
      return {
        success: true,
        numero: String(contrato.numero || contrato.id),
        jaAssinado: true,
      };
    }
    if (statusAtual === 'CANCELADO' || statusAtual === 'ENCERRADO') {
      throw new BadRequestException(
        `Contrato ${statusAtual.toLowerCase()} não pode ser assinado.`,
      );
    }
    const { buffer } = await this.getPdfBufferPorTokenPublico(token);
    const hashDocumento = createHash('sha256').update(buffer).digest('hex');
    const ipAddress = String(evidencias?.ipAddress || '').trim() || null;
    const userAgentRaw = String(evidencias?.userAgent || '').trim();
    const userAgent = userAgentRaw || null;
    const deviceLabel = String(evidencias?.deviceLabel || '').trim();
    const screen = String(evidencias?.screen || '').trim();
    const timezone = String(evidencias?.timezone || '').trim();
    const acceptanceLocalTime = String(
      evidencias?.acceptanceLocalTime || '',
    ).trim();
    const metodoVerificacao = [
      'Assinatura eletrônica via portal seguro',
      timezone ? `Fuso: ${timezone}` : null,
      acceptanceLocalTime
        ? `Hora local informada: ${acceptanceLocalTime}`
        : null,
    ]
      .filter(Boolean)
      .join(' | ');
    const dispositivoRegistrado =
      [
        userAgent,
        deviceLabel ? `Dispositivo: ${deviceLabel}` : null,
        screen ? `Tela: ${screen}` : null,
      ]
        .filter(Boolean)
        .join(' | ') || null;
    await this.prisma.assinaturas_log.create({
      data: {
        contrato_id: contrato.id,
        ip_address: ipAddress,
        dispositivo: dispositivoRegistrado,
        hash_documento: hashDocumento,
        metodo_verificacao:
          metodoVerificacao || 'Assinatura eletrônica via portal seguro',
      },
    });
    await this.prisma.contratos.update({
      where: { id: contrato.id },
      data: { status: 'VIGENTE', data_assinatura: new Date() } as any,
    });
    await this.salvarPdfContratoComSlot({
      contratoId: contrato.id,
      pdfBuffer: buffer,
      slotKey: 'CONTRATO_ASSINADO_EMPRESA',
      categoria: 'RELATORIO_INTERNO',
      nomeArquivo: `CONTRATO #${contrato.id} (base empresa)`,
    });
    const pdfFinalComCliente = await this.gerarContratoPdfBuffer(contrato.id);
    await this.salvarPdfContratoComSlot({
      contratoId: contrato.id,
      pdfBuffer: pdfFinalComCliente,
      slotKey: 'CONTRATO_ASSINADO_CLIENTE',
      categoria: 'RELATORIO',
      nomeArquivo: `CONTRATO #${contrato.id} (assinado cliente)`,
    });
    await this.garantirContaReceberDeVendaAssinada({
      venda_id: (contrato as any).venda_id ?? null,
      cliente_id: (contrato as any).cliente_id ?? null,
    });
    await this.atualizarStatusVendaParaProducaoAoVigorarContrato({
      venda_id: (contrato as any).venda_id ?? null,
      cliente_id: (contrato as any).cliente_id ?? null,
    });
    await this.garantirAgendaProducaoDaVendaAoVigorarContrato({
      id: contrato.id,
      venda_id: (contrato as any).venda_id ?? null,
      cliente_id: (contrato as any).cliente_id ?? null,
    });
    return { success: true, numero: String(contrato.numero || contrato.id) };
  }

  /**
   * Marca o contrato como vigente por assinatura presencial na loja.
   * Atualiza status para VIGENTE e data_assinatura. Se enviar PDF escaneado, grava como CONTRATO_ASSINADO_CLIENTE.
   */
  async marcarVigenteAssinaturaPresencial(
    contratoId: number,
    pdfEscaneado?: Buffer,
    criadoPorUsuarioId?: number,
  ) {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id: contratoId },
      select: { id: true, status: true, venda_id: true, cliente_id: true },
    });
    if (!contrato)
      throw new NotFoundException('Contrato não encontrado.');
    const statusAtual = String(contrato.status || '').toUpperCase();
    if (statusAtual === 'VIGENTE')
      throw new BadRequestException('Contrato já está vigente.');
    if (statusAtual === 'CANCELADO' || statusAtual === 'ENCERRADO')
      throw new BadRequestException(
        `Contrato ${statusAtual.toLowerCase()} não pode ser marcado como vigente.`,
      );

    await this.prisma.contratos.update({
      where: { id: contratoId },
      data: {
        status: 'VIGENTE',
        data_assinatura: new Date(),
        assinatura_presencial: true,
      } as any,
    });

    if (pdfEscaneado && Buffer.isBuffer(pdfEscaneado) && pdfEscaneado.length > 0) {
      await this.salvarPdfContratoComSlot({
        contratoId,
        pdfBuffer: pdfEscaneado,
        slotKey: 'CONTRATO_ASSINADO_CLIENTE',
        categoria: 'RELATORIO',
        nomeArquivo: `CONTRATO #${contratoId} (assinado presencialmente)`,
      });
    }

    await this.garantirContaReceberDeVendaAssinada({
      venda_id: contrato.venda_id ?? null,
      cliente_id: contrato.cliente_id ?? null,
    });
    await this.atualizarStatusVendaParaProducaoAoVigorarContrato({
      venda_id: contrato.venda_id ?? null,
      cliente_id: contrato.cliente_id ?? null,
    });
    await this.garantirAgendaProducaoDaVendaAoVigorarContrato(
      {
        id: contrato.id,
        venda_id: contrato.venda_id ?? null,
        cliente_id: contrato.cliente_id ?? null,
      },
      criadoPorUsuarioId,
    );

    return { success: true, status: 'VIGENTE' };
  }
}
