import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ✅ Fonte da verdade dos status (shared)
import { STATUS_FINANCEIRO_KEYS as SF } from '../../shared/constantes/status-financeiro';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // HELPERS
  // =========================================================
  private toNumber(value: any, field: string) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0)
      throw new BadRequestException(`${field} inválido`);
    return n;
  }

  private toDate(value: any, field: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
      throw new BadRequestException(`${field} inválida`);
    return d;
  }

  private parseFiltroDate(value: any, field: string, fimDoDia = false) {
    const raw = String(value || '').trim();
    if (!raw) return undefined;

    let d: Date | null = null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      d = new Date(`${raw}T00:00:00`);
    } else {
      const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yyyy = Number(m[3]);
        const parsed = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
        if (
          parsed.getFullYear() === yyyy &&
          parsed.getMonth() === mm - 1 &&
          parsed.getDate() === dd
        ) {
          d = parsed;
        }
      }
    }

    if (!d || Number.isNaN(d.getTime())) {
      throw new BadRequestException(
        `${field} invÃ¡lida. Use YYYY-MM-DD ou DD/MM/AAAA.`,
      );
    }

    if (fimDoDia) d.setHours(23, 59, 59, 999);
    return d;
  }

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // =========================================================
  // ✅ CONSOLIDADO (CONTAS A PAGAR) = DESPESAS + COMPRAS + FECHAMENTOS
  // =========================================================
  async listarContasPagarConsolidado(filtros: {
    fornecedor_id?: number;
    status?: string;
    data_ini?: string;
    data_fim?: string;
  }) {
    const status = filtros.status || undefined;
    const fornecedorId = filtros.fornecedor_id || undefined;
    const dataIni = this.parseFiltroDate(filtros.data_ini, 'data_ini');
    const dataFim = this.parseFiltroDate(filtros.data_fim, 'data_fim', true);
    if (dataIni && dataFim && dataIni.getTime() > dataFim.getTime()) {
      throw new BadRequestException('data_ini nÃ£o pode ser maior que data_fim');
    }

    const whereDespesas: any = { status };
    const whereCompras: any = { fornecedor_id: fornecedorId, status };
    const whereFechamentos: any = { fornecedor_id: fornecedorId, status };

    if (dataIni || dataFim) {
      whereDespesas.data_vencimento = {};
      whereCompras.data_compra = {};
      whereFechamentos.vencimento_em = {};

      if (dataIni) {
        whereDespesas.data_vencimento.gte = dataIni;
        whereCompras.data_compra.gte = dataIni;
        whereFechamentos.vencimento_em.gte = dataIni;
      }
      if (dataFim) {
        whereDespesas.data_vencimento.lte = dataFim;
        whereCompras.data_compra.lte = dataFim;
        whereFechamentos.vencimento_em.lte = dataFim;
      }
    }

    const [despesas, compras, fechamentos] = await Promise.all([
      // DESPESAS
      this.prisma.despesas.findMany({
        where: whereDespesas,
        orderBy: { data_vencimento: 'asc' },
      }),

      // COMPRAS
      this.prisma.compras.findMany({
        where: whereCompras,
        include: {
          fornecedor: true,
          itens: {
            select: {
              nome_produto: true,
            },
          },
        },
        orderBy: { data_compra: 'asc' },
      }),

      // CONTAS_PAGAR (FECHAMENTO MENSAL)
      this.prisma.contas_pagar.findMany({
        where: whereFechamentos,
        include: {
          fornecedor: true,
          fornecedor_cobrador: true,
        },
        orderBy: { vencimento_em: 'asc' },
      }),
    ]);

    return [
      // =====================
      // DESPESAS (origem = DESPESA)
      // =====================
      ...despesas.map((d) => ({
        id: d.id,
        origem: 'DESPESA',

        fornecedor_id: null,
        fornecedor_nome: null,

        descricao: d.categoria,
        observacao: d.classificacao,

        valor: d.valor_total,
        valor_compensado: 0,

        vencimento_em: d.data_vencimento,
        pago_em: d.data_pagamento,
        status: d.status,

        mes_referencia: null,
        ano_referencia: null,
        cheques_total: 0,
      })),

      // =====================
      // COMPRAS (origem = COMPRA)
      // =====================
      ...compras.map((c) => {
        const itensNomes = Array.isArray((c as any).itens)
          ? (c as any).itens
              .map((it: any) => String(it?.nome_produto || '').trim())
              .filter(Boolean)
          : [];

        const resumoBase = itensNomes.slice(0, 3).join(' + ');
        const sufixo =
          itensNomes.length > 3
            ? ` +${itensNomes.length - 3} item(ns)`
            : '';

        const descricaoCompra = resumoBase
          ? `COMPRA: ${resumoBase}${sufixo}`
          : 'COMPRA';

        const observacaoCompra = [
          c.tipo_compra ? String(c.tipo_compra) : null,
          itensNomes.length ? `${itensNomes.length} item(ns)` : null,
        ]
          .filter(Boolean)
          .join(' | ');

        return {
        id: c.id,
        origem: 'COMPRA',

        fornecedor_id: c.fornecedor_id,
        fornecedor_nome: c.fornecedor?.nome_fantasia || null,

        descricao: descricaoCompra,
        observacao: observacaoCompra || c.tipo_compra || null,

        valor: c.valor_total,
        valor_compensado: 0,

        data_compra: c.data_compra,
        vencimento_em: c.vencimento_em,
        pago_em: null,
        status: c.status,

        mes_referencia: null,
        ano_referencia: null,
        cheques_total: 0,
        };
      }),

      // =====================
      // FECHAMENTOS (origem = FECHAMENTO)
      // =====================
      ...fechamentos.map((cp) => ({
        id: cp.id,
        origem: 'FECHAMENTO',

        fornecedor_id: cp.fornecedor_id,
        fornecedor_nome: cp.fornecedor?.nome_fantasia || null,

        descricao:
          cp.descricao ||
          `Fechamento ${String(cp.mes_referencia).padStart(2, '0')}/${cp.ano_referencia}`,
        observacao: cp.observacao || null,

        valor: cp.valor_original,
        valor_compensado: cp.valor_compensado,

        vencimento_em: cp.vencimento_em,
        pago_em: cp.pago_em,
        status: cp.status,

        mes_referencia: cp.mes_referencia,
        ano_referencia: cp.ano_referencia,

        cheques_total: 0,

        fornecedor_cobrador_nome: cp.fornecedor_cobrador?.nome_fantasia || null,
        forma_pagamento_chave: cp.forma_pagamento_chave || null,
      })),
    ];
  }

  // =========================================================
  // ✅ ATUALIZA VENCIDOS (FINANCEIRO) — INCLUI TÍTULOS
  // =========================================================
  async atualizarVencidos() {
    const hoje = new Date();

    await this.prisma.despesas.updateMany({
      where: {
        data_vencimento: { lt: hoje },
        status: SF.EM_ABERTO,
      },
      data: { status: SF.VENCIDO },
    });

    await this.prisma.compras.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: SF.EM_ABERTO,
      },
      data: { status: SF.VENCIDO },
    });

    await this.prisma.contas_pagar.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: SF.EM_ABERTO,
        pago_em: null,
      },
      data: { status: SF.VENCIDO },
    });

    await this.prisma.contas_receber.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: SF.EM_ABERTO,
        recebido_em: null,
      },
      data: { status: SF.VENCIDO },
    });

    // ✅ CRUCIAL: títulos vencem de verdade
    await this.prisma.titulos_financeiros.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: SF.EM_ABERTO,
        pago_em: null,
      },
      data: { status: SF.VENCIDO },
    });
  }

  // =========================================================
  // CONTAS A PAGAR (tabela contas_pagar)
  // =========================================================
  async buscarContaPagar(id: number) {
    return this.prisma.contas_pagar.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        fornecedor_cobrador: true,
        despesa: true,
        titulos: true,
      },
    });
  }

  async criarContaPagar(dto: any) {
    return this.prisma.contas_pagar.create({ data: dto });
  }

  async atualizarContaPagar(id: number, dto: any) {
    return this.prisma.contas_pagar.update({ where: { id }, data: dto });
  }

  async removerContaPagar(id: number) {
    return this.prisma.contas_pagar.delete({ where: { id } });
  }

  /**
   * ✅ LEGADO (não usar no fluxo novo):
   * Marca conta como PAGO e cria uma despesa. Mantido para não quebrar telas antigas.
   * O fluxo novo de baixa/parcelamento é via titulos_financeiros.
   */
  async pagarContaPagar(id: number, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const conta = await tx.contas_pagar.findUnique({
        where: { id },
        select: {
          id: true,
          valor_original: true,
          forma_pagamento_chave: true,
          vencimento_em: true,
          status: true,
        },
      });
      if (!conta) throw new NotFoundException('Conta a pagar não encontrada');

      const pagoEm = new Date();

      const contaAtualizada = await tx.contas_pagar.update({
        where: { id },
        data: { status: SF.PAGO, pago_em: pagoEm },
      });

      await tx.despesas.create({
        data: {
          tipo_movimento: 'SAIDA',
          unidade: dto?.unidade || 'FÁBRICA',
          categoria: dto?.categoria || 'PAGAMENTO_FORNECEDOR',
          classificacao: dto?.classificacao || 'OPERACIONAL',
          local: dto?.local || 'ESTOQUE',

          valor_total: conta.valor_original,
          forma_pagamento: conta.forma_pagamento_chave || 'DINHEIRO',
          quantidade_parcelas: 1,

          data_vencimento: conta.vencimento_em,
          data_pagamento: pagoEm,

          status: SF.PAGO,
          recorrencia_id: `CP-${conta.id}`,
        },
      });

      return contaAtualizada;
    });
  }

  async listarTitulosContaPagar(contaPagarId: number) {
    const conta = await this.prisma.contas_pagar.findUnique({
      where: { id: contaPagarId },
      select: { id: true },
    });
    if (!conta) throw new NotFoundException('Conta a pagar não encontrada');

    return this.prisma.titulos_financeiros.findMany({
      where: { conta_pagar_id: contaPagarId },
      orderBy: [
        { parcela_numero: 'asc' },
        { vencimento_em: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  async pagarTituloContaPagar(contaPagarId: number, tituloId: number, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const conta = await tx.contas_pagar.findUnique({
        where: { id: contaPagarId },
        select: { id: true, status: true },
      });
      if (!conta) throw new NotFoundException('Conta a pagar não encontrada');

      const titulo = await tx.titulos_financeiros.findFirst({
        where: { id: tituloId, conta_pagar_id: contaPagarId },
        select: { id: true, status: true, meta: true },
      });
      if (!titulo) throw new NotFoundException('Título financeiro não encontrado');
      if (titulo.status === SF.PAGO)
        throw new BadRequestException('Título já está pago');
      if (titulo.status === SF.CANCELADO)
        throw new BadRequestException('Título cancelado não pode ser pago');

      const pagoEm = dto?.pago_em ? this.toDate(dto.pago_em, 'pago_em') : new Date();

      const metaAtual =
        titulo.meta && typeof titulo.meta === 'object' && !Array.isArray(titulo.meta)
          ? (titulo.meta as Record<string, any>)
          : {};
      const metaInput =
        dto?.meta && typeof dto.meta === 'object' && !Array.isArray(dto.meta)
          ? (dto.meta as Record<string, any>)
          : {};

      const tituloPago = await tx.titulos_financeiros.update({
        where: { id: titulo.id },
        data: {
          status: SF.PAGO,
          pago_em: pagoEm,
          meta: {
            ...metaAtual,
            ...metaInput,
            baixa_manual_em: pagoEm.toISOString(),
            baixa_manual_obs: dto?.observacao ? String(dto.observacao) : null,
          },
        },
      });

      const pendentes = await tx.titulos_financeiros.count({
        where: {
          conta_pagar_id: contaPagarId,
          status: { in: [SF.EM_ABERTO, SF.VENCIDO] },
        },
      });

      if (pendentes === 0) {
        await tx.contas_pagar.update({
          where: { id: contaPagarId },
          data: { status: SF.PAGO, pago_em: pagoEm },
        });
      } else {
        const existeVencido = await tx.titulos_financeiros.findFirst({
          where: { conta_pagar_id: contaPagarId, status: SF.VENCIDO },
          select: { id: true },
        });

        await tx.contas_pagar.update({
          where: { id: contaPagarId },
          data: {
            status: existeVencido ? SF.VENCIDO : SF.EM_ABERTO,
            pago_em: null,
          },
        });
      }

      return tituloPago;
    });
  }

  // =========================================================
  // ✅ PREVIEW DO FECHAMENTO (ETAPA 1 DO MODAL)
  // Plano de corte é VENDA pro fornecedor => CRÉDITO/ABATIMENTO
  // =========================================================
  async previewFechamentoFornecedor(body: {
    fornecedor_id: number;
    mes: number;
    ano: number;
  }) {
    const fornecedor_id = this.toNumber(body?.fornecedor_id, 'fornecedor_id');
    const mes = this.toNumber(body?.mes, 'mes');
    const ano = this.toNumber(body?.ano, 'ano');

    const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const compras = await this.prisma.compras.findMany({
      where: {
        fornecedor_id,
        status: SF.EM_ABERTO,
        data_compra: { gte: inicio, lte: fim },
      },
      select: { id: true, valor_total: true },
    });

    const totalCompras = this.round2(
      compras.reduce((s, c) => s + Number((c as any).valor_total || 0), 0),
    );

    const planos = await this.prisma.plano_corte.findMany({
      where: {
        fornecedor_id,
        status: SF.EM_ABERTO,
        data_venda: { gte: inicio, lte: fim },
      },
      select: { id: true, valor_total: true },
    });

    const totalPlanos = this.round2(
      planos.reduce((s, p) => s + Number((p as any).valor_total || 0), 0),
    );

    const compensado_auto = this.round2(Math.min(totalCompras, totalPlanos));
    const saldo_a_pagar_auto = this.round2(
      Math.max(totalCompras - totalPlanos, 0),
    );
    const credito_sobra_auto = this.round2(
      Math.max(totalPlanos - totalCompras, 0),
    );

    return {
      fornecedor_id,
      mes,
      ano,
      total_compras: totalCompras,
      total_planos: totalPlanos,
      compensado_auto,
      saldo_a_pagar_auto,
      credito_sobra_auto,
    };
  }

  // =========================================================
  // ✅ FECHAR MÊS (ETAPA 2 DO MODAL) — CRIA contas_pagar + titulos_financeiros
  // Plano de corte ABATE compras (venda pro fornecedor)
  // =========================================================
  async fecharMesFornecedorComTitulos(body: any) {
    const fornecedor_id = this.toNumber(body?.fornecedor_id, 'fornecedor_id');
    const mes = this.toNumber(body?.mes, 'mes');
    const ano = this.toNumber(body?.ano, 'ano');

    const tipo = String(body?.forma_pagamento_chave || '').trim(); // CHEQUE | CARTAO
    if (!tipo)
      throw new BadRequestException('forma_pagamento_chave é obrigatório');

    // opcional: Rimad cobrador (se quiser usar)
    const fornecedor_cobrador_id = body?.fornecedor_cobrador_id
      ? this.toNumber(body.fornecedor_cobrador_id, 'fornecedor_cobrador_id')
      : null;

    // ✅ campos livres (podem ser 0)
    const valorDever = Number(body?.valor_dever || 0); // soma no débito
    const valorCreditar = Number(body?.valor_creditar || 0); // soma no crédito

    const pctLiberado = Math.max(
      0,
      Math.min(100, Number(body?.percentual_liberado ?? 100)),
    );
    const descontoPct = Math.max(
      0,
      Math.min(100, Number(body?.desconto_percentual ?? 0)),
    );

    const parcelas = Array.isArray(body?.parcelas) ? body.parcelas : [];

    const vencPadrao = body?.vencimento_em
      ? this.toDate(body.vencimento_em, 'vencimento_em')
      : new Date(ano, mes, 5);

    return this.prisma.$transaction(async (tx) => {
      // 0) não duplicar fechamento
      const jaExiste = await tx.contas_pagar.findFirst({
        where: { fornecedor_id, mes_referencia: mes, ano_referencia: ano },
        select: { id: true },
      });
      if (jaExiste)
        throw new BadRequestException(
          'Já existe fechamento deste fornecedor para o mês/ano.',
        );

      // 1) automático
      const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
      const fim = new Date(ano, mes, 0, 23, 59, 59);

      const compras = await tx.compras.findMany({
        where: {
          fornecedor_id,
          status: SF.EM_ABERTO,
          data_compra: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      });
      const totalCompras = this.round2(
        compras.reduce((s, c) => s + Number((c as any).valor_total || 0), 0),
      );

      const planos = await tx.plano_corte.findMany({
        where: {
          fornecedor_id,
          status: SF.EM_ABERTO,
          data_venda: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      });
      const totalPlanos = this.round2(
        planos.reduce((s, p) => s + Number((p as any).valor_total || 0), 0),
      );

      const compensado_auto = this.round2(Math.min(totalCompras, totalPlanos));

      // 2) cálculo final (correto: plano ABATE)
      const debito_base = this.round2(totalCompras + Math.max(valorDever, 0));
      const credito_auto = this.round2(Math.max(totalPlanos, 0));
      const credito_extra = this.round2(
        (Math.max(valorCreditar, 0) * pctLiberado) / 100,
      );

      const subtotal = this.round2(
        Math.max(debito_base - (credito_auto + credito_extra), 0),
      );
      const desconto_valor = this.round2((subtotal * descontoPct) / 100);
      const total_final = this.round2(Math.max(subtotal - desconto_valor, 0));

      const compensado_total = this.round2(
        Math.min(debito_base, credito_auto + credito_extra),
      );

      const parcelasValidas: Array<{
        parcela: number;
        valor: number;
        vencimento_em: Date;
      }> = [];

      if (total_final > 0) {
        if (!parcelas.length)
          throw new BadRequestException('parcelas é obrigatório');

        for (const p of parcelas) {
          const parcelaNum = Number(p?.parcela || 0);
          const valor = Number(p?.valor || 0);
          const venc = String(p?.vencimento_em || '').trim();

          if (!Number.isFinite(parcelaNum) || parcelaNum <= 0)
            throw new BadRequestException('parcela inválida');
          if (!Number.isFinite(valor) || valor <= 0)
            throw new BadRequestException('valor de parcela inválido');

          parcelasValidas.push({
            parcela: parcelaNum,
            valor: this.round2(valor),
            vencimento_em: this.toDate(venc, 'vencimento_em'),
          });
        }

        const somaParcelas = this.round2(
          parcelasValidas.reduce((s, p) => s + p.valor, 0),
        );
        if (somaParcelas !== total_final) {
          throw new BadRequestException(
            `Soma das parcelas (${somaParcelas}) deve ser igual ao total final (${total_final}).`,
          );
        }
      }

      // 3) cria FECHAMENTO (contas_pagar)
      const contaPagar = await tx.contas_pagar.create({
        data: {
          fornecedor_id,
          fornecedor_cobrador_id: fornecedor_cobrador_id || null,

          mes_referencia: mes,
          ano_referencia: ano,

          descricao: `Fechamento ${String(mes).padStart(2, '0')}/${ano}`,
          observacao: [
            `AUTO compras=${totalCompras} planos=${totalPlanos} comp_auto=${compensado_auto}`,
            `MANUAL dever=${valorDever} creditar=${valorCreditar} pct=${pctLiberado}% desc=${descontoPct}%`,
            `CALC debito=${debito_base} cred_auto=${credito_auto} cred_extra=${credito_extra} comp_total=${compensado_total} subtotal=${subtotal} desc_val=${desconto_valor} total=${total_final}`,
            `PAGTO tipo=${tipo} parcelas=${parcelasValidas.length}`,
          ].join(' | '),

          valor_original: total_final,
          valor_compensado: compensado_total,

          status: total_final > 0 ? SF.EM_ABERTO : SF.PAGO,
          forma_pagamento_chave: tipo,

          parcelas_total: parcelasValidas.length || null,
          parcela_numero: null,

          vencimento_em: vencPadrao,
          pago_em: total_final > 0 ? null : new Date(),
        },
        select: { id: true },
      });

      // 4) cria TITULOS FINANCEIROS (status usando SF)
      if (parcelasValidas.length) {
        await tx.titulos_financeiros.createMany({
          data: parcelasValidas.map((p) => ({
            conta_pagar_id: contaPagar.id,

            tipo, // CHEQUE | CARTAO
            valor: p.valor,

            status: SF.EM_ABERTO,
            vencimento_em: p.vencimento_em,
            pago_em: null,

            parcelas_total: parcelasValidas.length,
            parcela_numero: p.parcela,

            meta: {
              fornecedor_id,
              fornecedor_cobrador_id,
              mes,
              ano,

              total_compras: totalCompras,
              total_planos: totalPlanos,

              valor_dever: valorDever,
              valor_creditar: valorCreditar,
              percentual_liberado: pctLiberado,
              desconto_percentual: descontoPct,

              debito_base,
              credito_auto,
              credito_extra,
              compensado_total,
              total_final,
            },
          })),
        });
      }

      // 5) atualiza origens (mantém seu padrão atual)
      if (compras.length) {
        await tx.compras.updateMany({
          where: { id: { in: compras.map((c) => c.id) } },
          data: { status: SF.PAGO },
        });
      }

      if (planos.length) {
        await tx.plano_corte.updateMany({
          where: { id: { in: planos.map((p) => p.id) } },
          data: { status: SF.PAGO },
        });
      }

      return {
        fornecedor_id,
        mes,
        ano,
        total_compras: totalCompras,
        total_planos: totalPlanos,
        compensado_auto,
        compensado_total,
        total_final,
        conta_pagar_id: contaPagar.id,
      };
    });
  }

  // =========================================================
  // CONTAS A RECEBER (mantido)
  // =========================================================
  async listarContasReceber(filtros: {
    fornecedor_id?: number;
    cliente_id?: number;
    status?: string;
    data_ini?: string;
    data_fim?: string;
  }) {
    const where: any = {
      fornecedor_id: filtros.fornecedor_id || undefined,
      cliente_id: filtros.cliente_id || undefined,
      status: filtros.status || undefined,
    };

    if (filtros.data_ini || filtros.data_fim) {
      where.vencimento_em = {};
      if (filtros.data_ini)
        where.vencimento_em.gte = new Date(filtros.data_ini);
      if (filtros.data_fim)
        where.vencimento_em.lte = new Date(filtros.data_fim);
    }

    return this.prisma.contas_receber.findMany({
      where,
      orderBy: [{ vencimento_em: 'asc' }, { id: 'desc' }],
    });
  }

  async buscarContaReceber(id: number) {
    return this.prisma.contas_receber.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        cliente: true,
        compensacoes: true,
        titulos: true,
      },
    });
  }

  async criarContaReceber(dto: any) {
    return this.prisma.contas_receber.create({ data: dto });
  }

  async removerContaReceber(id: number) {
    return this.prisma.contas_receber.delete({ where: { id } });
  }

  async atualizarContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({ where: { id }, data: dto });
  }

  async receberContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({
      where: { id },
      data: {
        status: SF.PAGO,
        recebido_em: new Date(),
        ...dto,
      },
    });
  }

  // =========================================================
  // ✅ COMPENSAÇÃO (mantido)
  // =========================================================
  async compensarFornecedor(fornecedorId: number, dto: any) {
    const fornecedor_id = this.toNumber(fornecedorId, 'fornecedorId');
    const conta_pagar_id = this.toNumber(dto?.conta_pagar_id, 'conta_pagar_id');
    const conta_receber_id = this.toNumber(
      dto?.conta_receber_id,
      'conta_receber_id',
    );
    const valor = Number(dto?.valor || 0);
    if (!Number.isFinite(valor) || valor <= 0)
      throw new BadRequestException('valor inválido');

    return this.prisma.fornecedor_compensacoes.create({
      data: {
        fornecedor_id,
        conta_pagar_id,
        conta_receber_id,
        valor,
        observacao: dto?.observacao ? String(dto.observacao).trim() : null,
      },
    });
  }

  async listarContasPagarFechamentos(filtros: {
    fornecedor_id?: number;
    status?: string;
    data_ini?: string;
    data_fim?: string;
  }) {
    const where: any = {
      fornecedor_id: filtros.fornecedor_id || undefined,
      status: filtros.status?.trim() || undefined,
    };

    if (filtros.data_ini || filtros.data_fim) {
      where.vencimento_em = {};
      if (filtros.data_ini)
        where.vencimento_em.gte = new Date(filtros.data_ini);
      if (filtros.data_fim)
        where.vencimento_em.lte = new Date(filtros.data_fim);
    }

    return this.prisma.contas_pagar.findMany({
      where,
      include: {
        fornecedor: true,
        fornecedor_cobrador: true,
      },
      orderBy: [{ vencimento_em: 'asc' }, { id: 'desc' }],
    });
  }

  // =========================================================
  // ✅ FECHAMENTO ANTIGO (MANTIDO PARA NÃO QUEBRAR)
  // (você pode remover quando o novo fluxo estiver em produção)
  // =========================================================
  async fecharMesFornecedor(body: {
    fornecedor_id: number;
    mes: number;
    ano: number;
    forma_pagamento_chave: string;
    vencimento_em?: string;
  }) {
    const fornecedor_id = this.toNumber(body?.fornecedor_id, 'fornecedor_id');
    const mes = this.toNumber(body?.mes, 'mes');
    const ano = this.toNumber(body?.ano, 'ano');
    const forma = String(body?.forma_pagamento_chave || '').trim();
    if (!forma)
      throw new BadRequestException('forma_pagamento_chave é obrigatório');

    return this.prisma.$transaction(async (tx) => {
      const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
      const fim = new Date(ano, mes, 0, 23, 59, 59);

      const compras = await tx.compras.findMany({
        where: {
          fornecedor_id,
          status: SF.EM_ABERTO,
          data_compra: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      });
      const totalCompras = this.round2(
        compras.reduce((s, c) => s + Number((c as any).valor_total || 0), 0),
      );

      const planos = await tx.plano_corte.findMany({
        where: {
          fornecedor_id,
          status: SF.EM_ABERTO,
          data_venda: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      });
      const totalPlanos = this.round2(
        planos.reduce((s, p) => s + Number((p as any).valor_total || 0), 0),
      );

      const compensado = this.round2(Math.min(totalCompras, totalPlanos));
      const valorAPagar = this.round2(Math.max(totalCompras - totalPlanos, 0));
      const saldo = this.round2(totalCompras - totalPlanos);

      const vencPadrao = body?.vencimento_em
        ? this.toDate(body.vencimento_em, 'vencimento_em')
        : new Date(ano, mes, 5);

      const contaPagar = await tx.contas_pagar.create({
        data: {
          fornecedor_id,
          mes_referencia: mes,
          ano_referencia: ano,
          descricao: `Fechamento ${String(mes).padStart(2, '0')}/${ano}`,
          observacao: `Compras: ${totalCompras} | PlanoCorte: ${totalPlanos} | Compensado: ${compensado} | Saldo: ${saldo}`,
          valor_original: valorAPagar,
          valor_compensado: compensado,
          status: valorAPagar > 0 ? SF.EM_ABERTO : SF.PAGO,
          forma_pagamento_chave: forma,
          vencimento_em: vencPadrao,
          pago_em: valorAPagar > 0 ? null : new Date(),
        },
        select: { id: true },
      });

      if (compras.length) {
        await tx.compras.updateMany({
          where: { id: { in: compras.map((c) => c.id) } },
          data: { status: SF.PAGO },
        });
      }

      if (planos.length) {
        await tx.plano_corte.updateMany({
          where: { id: { in: planos.map((p) => p.id) } },
          data: { status: SF.PAGO },
        });
      }

      return {
        fornecedor_id,
        mes,
        ano,
        total_compras: totalCompras,
        total_planos: totalPlanos,
        saldo_final: saldo,
        valor_a_pagar: valorAPagar,
        conta_pagar_id: contaPagar.id,
      };
    });
  }
}
