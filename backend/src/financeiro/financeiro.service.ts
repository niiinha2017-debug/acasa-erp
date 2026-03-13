import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ✅ Fonte da verdade dos status (shared)
import { STATUS_FINANCEIRO_KEYS as SF } from '../../shared/constantes/status-financeiro';
import { OBRA_VIGENTE_STATUSES } from '../../shared/constantes/pipeline-cliente';
import { getDataCorteContasReceber } from '../../shared/constantes/pipeline-regras';
import {
  CustosEstruturaService,
  CATEGORIAS_DESPESA_FIXA_SALARIOS,
} from './custos-estrutura.service';
import type {
  FechamentoFornecedorItem,
  FechamentoFornecedorItemOrigem,
} from './dto/fechamento-fornecedor.dto';

@Injectable()
export class FinanceiroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly custosEstrutura: CustosEstruturaService,
  ) {}

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

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // =========================================================
  // Dashboard Central de Consolidação: totais para cards
  // =========================================================
  async getContasPagarDashboard(filtros: {
    mes?: number;
    ano?: number;
  }) {
    const hoje = new Date();
    const mes = filtros.mes ?? hoje.getMonth() + 1;
    const ano = filtros.ano ?? hoje.getFullYear();
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const [titulosAberto, despesasAberto, comprasAberto, fornecedores] =
      await Promise.all([
        this.prisma.titulos_financeiros.findMany({
          where: {
            OR: [{ conta_pagar_id: { not: null } }, { despesa_id: { not: null } }],
            status: { in: [SF.EM_ABERTO, SF.VENCIDO] },
            vencimento_em: { gte: inicioMes, lte: fimMes },
          },
          select: { valor: true, tipo: true },
        }),
        this.prisma.despesas.findMany({
          where: {
            titulos: { none: {} },
            status: { in: [SF.EM_ABERTO, SF.VENCIDO] },
            data_vencimento: { gte: inicioMes, lte: fimMes },
          },
          select: { valor_total: true },
        }),
        this.prisma.compras.findMany({
          where: {
            status: SF.EM_ABERTO,
            data_compra: { gte: inicioMes, lte: fimMes },
          },
          select: { valor_total: true },
        }),
        this.prisma.fornecedor.findMany({
          where: { saldo_credito: { gt: 0 } },
          select: { saldo_credito: true },
        }),
      ]);

    const totalAbertoTitulos = titulosAberto.reduce(
      (s, t) => s + Number((t as any).valor ?? 0),
      0,
    );
    const totalAbertoDespesas = despesasAberto.reduce(
      (s, d) => s + Number((d as any).valor_total ?? 0),
      0,
    );
    const totalAbertoCompras = comprasAberto.reduce(
      (s, c) => s + Number((c as any).valor_total ?? 0),
      0,
    );
    const total_a_vencer_mes = this.round2(
      totalAbertoTitulos + totalAbertoDespesas + totalAbertoCompras,
    );
    const cheques_a_compensar = this.round2(
      titulosAberto
        .filter((t) => String((t as any).tipo ?? '').toUpperCase() === 'CHEQUE')
        .reduce((s, t) => s + Number((t as any).valor ?? 0), 0),
    );
    const creditos_disponiveis = this.round2(
      fornecedores.reduce(
        (s, f) => s + Number((f as any).saldo_credito ?? 0),
        0,
      ),
    );

    return {
      total_a_vencer_mes,
      cheques_a_compensar,
      creditos_disponiveis,
      mes,
      ano,
    };
  }

  // =========================================================
  // ✅ FECHAMENTO POR FORNECEDOR (Contas a Pagar agrupado)
  // Agrupa por fornecedorId + mês/ano; soma Compra + Serviço de Corte; subtrai Abatimentos (créditos).
  // =========================================================
  async listarFechamentoPorFornecedor(filtros: {
    mes: number;
    ano: number;
    fornecedor_id?: number;
  }): Promise<FechamentoFornecedorItem[]> {
    const mes = Number(filtros.mes) || new Date().getMonth() + 1;
    const ano = Number(filtros.ano) || new Date().getFullYear();
    const fornecedorId = filtros.fornecedor_id;

    const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const whereCompras: any = {
      status: SF.EM_ABERTO,
      data_compra: { gte: inicio, lte: fim },
    };
    if (fornecedorId != null) whereCompras.fornecedor_id = fornecedorId;

    const wherePlanos: any = {
      status: { notIn: [SF.COMPENSADO, 'CANCELADO'] },
      data_venda: { gte: inicio, lte: fim },
    };
    if (fornecedorId != null) wherePlanos.fornecedor_id = fornecedorId;

    const [compras, planos] = await Promise.all([
      this.prisma.compras.findMany({
        where: whereCompras,
        include: {
          fornecedor: { select: { id: true, nome_fantasia: true, razao_social: true } },
          itens: { select: { nome_produto: true } },
        },
        orderBy: { data_compra: 'asc' },
      }),
      this.prisma.plano_corte.findMany({
        where: wherePlanos,
        include: { fornecedor: { select: { id: true, nome_fantasia: true, razao_social: true } } },
        orderBy: { data_venda: 'asc' },
      }),
    ]);

    const fornecedorIds = Array.from(
      new Set([
        ...compras.map((c) => c.fornecedor_id),
        ...planos.map((p) => p.fornecedor_id),
      ]),
    );
    const fornecedoresComCredito =
      fornecedorIds.length > 0
        ? await this.prisma.fornecedor.findMany({
            where: { id: { in: fornecedorIds } },
            select: { id: true, nome_fantasia: true, razao_social: true, saldo_credito: true },
          })
        : [];

    const creditoPorFornecedor = new Map<number, number>();
    for (const f of fornecedoresComCredito) {
      creditoPorFornecedor.set(f.id, Number((f as any).saldo_credito ?? 0));
    }

    // Agrupar por fornecedor_id
    const porFornecedor = new Map<
      number,
      {
        fornecedor_nome: string | null;
        itensOrigem: FechamentoFornecedorItemOrigem[];
        totalCompras: number;
        totalPlanos: number;
      }
    >();

    const addFornecedor = (id: number, nome: string | null) => {
      if (!porFornecedor.has(id)) {
        porFornecedor.set(id, {
          fornecedor_nome: nome,
          itensOrigem: [],
          totalCompras: 0,
          totalPlanos: 0,
        });
      }
    };

    for (const c of compras) {
      const fid = c.fornecedor_id;
      const nome = (c as any).fornecedor?.nome_fantasia || (c as any).fornecedor?.razao_social || null;
      addFornecedor(fid, nome);
      const entry = porFornecedor.get(fid)!;
      const valor = Number((c as any).valor_total ?? 0);
      entry.totalCompras += valor;
      const itens = (c as any).itens || [];
      const nomesProdutos = itens.map((i: any) => i.nome_produto || '').filter(Boolean);
      let dataStr = '';
      if (c.data_compra) {
        const d = new Date(c.data_compra);
        dataStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
      }
      const descricao =
        nomesProdutos.length > 0 ? `Compra — ${nomesProdutos.join(', ')}` : (c as any).tipo_compra || 'Compra';
      entry.itensOrigem.push({
        id: c.id,
        origem: 'COMPRA',
        descricao,
        data_referencia: dataStr || null,
        valor,
        status: c.status,
      });
    }

    for (const p of planos) {
      const fid = p.fornecedor_id;
      const nome = (p as any).fornecedor?.nome_fantasia || (p as any).fornecedor?.razao_social || null;
      addFornecedor(fid, nome);
      const entry = porFornecedor.get(fid)!;
      const valor = Number((p as any).valor_total ?? 0);
      entry.totalPlanos += valor;
      let dataStr = '';
      if (p.data_venda) {
        const d = new Date(p.data_venda);
        dataStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
      }
      entry.itensOrigem.push({
        id: p.id,
        origem: 'SERVICO_CORTE',
        descricao: 'Serviço de Corte',
        data_referencia: dataStr || null,
        valor,
        status: p.status,
      });
    }

    const result: FechamentoFornecedorItem[] = [];

    for (const [fid, data] of porFornecedor.entries()) {
      const subtotal = this.round2(data.totalCompras);
      const creditoDisponivel = creditoPorFornecedor.get(fid) ?? 0;
      const abatePlanos = this.round2(Math.min(data.totalPlanos, subtotal));
      const baseAposPlanos = this.round2(Math.max(0, subtotal - abatePlanos));
      const abateCredito = this.round2(Math.min(creditoDisponivel, baseAposPlanos));
      const total_abatimentos = this.round2(abatePlanos + abateCredito);
      const valor_liquido = this.round2(Math.max(0, subtotal - total_abatimentos));

      const fornecedorNome =
        data.fornecedor_nome ||
        fornecedoresComCredito.find((f) => f.id === fid)?.nome_fantasia ||
        fornecedoresComCredito.find((f) => f.id === fid)?.razao_social ||
        null;

      result.push({
        fornecedor_id: fid,
        fornecedor_nome: fornecedorNome,
        mes,
        ano,
        subtotal,
        total_abatimentos,
        valor_liquido,
        itens: data.itensOrigem.sort((a, b) => {
          const da = a.data_referencia || '';
          const db = b.data_referencia || '';
          return da.localeCompare(db) || a.origem.localeCompare(b.origem);
        }),
      });
    }

    result.sort((a, b) => (a.fornecedor_nome || '').localeCompare(b.fornecedor_nome || ''));
    return result;
  }

  // =========================================================
  // ✅ CONSOLIDADO (CONTAS A PAGAR) = DESPESAS + COMPRAS + FECHAMENTOS
  // Lista unificada por data de vencimento; filtros: fornecedor_id, mes/ano competência
  // =========================================================
  async listarContasPagarConsolidado(filtros: {
    status?: string;
    data_ini?: string;
    data_fim?: string;
    fornecedor_id?: number;
    mes?: number;
    ano?: number;
  }) {
    const status = filtros.status || undefined;
    const fornecedorId = filtros.fornecedor_id;
    let dataIni = filtros.data_ini
      ? new Date(filtros.data_ini + 'T00:00:00')
      : undefined;
    let dataFim = filtros.data_fim
      ? new Date(filtros.data_fim + 'T23:59:59')
      : undefined;

    // Compras: sempre período do mês (1º ao último dia). Se só data_ini veio, fecha no último dia do mês.
    if (dataIni && !dataFim) {
      dataFim = new Date(
        dataIni.getFullYear(),
        dataIni.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
    }
    if (dataFim && !dataIni) {
      dataIni = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1, 0, 0, 0);
    }

    const whereDespesas: any = {};
    // Unificado: compras compensadas só aparecem na aba Compensados
    const whereCompras: any = status ? { status } : { status: { not: SF.COMPENSADO } };
    const whereContasPagar: any = status ? { status } : {};
    if (fornecedorId != null) {
      whereContasPagar.fornecedor_id = fornecedorId;
      whereCompras.fornecedor_id = fornecedorId;
    }
    if (filtros.mes != null && filtros.ano != null) {
      whereContasPagar.mes_referencia = filtros.mes;
      whereContasPagar.ano_referencia = filtros.ano;
    }
    const rangeCompras =
      filtros.mes != null && filtros.ano != null
        ? {
            gte: new Date(filtros.ano, filtros.mes - 1, 1, 0, 0, 0),
            lte: new Date(filtros.ano, filtros.mes, 0, 23, 59, 59),
          }
        : dataIni || dataFim
          ? { gte: dataIni!, lte: dataFim! }
          : undefined;
    if (rangeCompras) whereCompras.data_compra = rangeCompras;

    if (dataIni || dataFim) {
      const range: any = {};
      if (dataIni) range.gte = dataIni;
      if (dataFim) range.lte = dataFim;
      whereContasPagar.vencimento_em = range;
      whereDespesas.OR = [
        { titulos: { some: { vencimento_em: range } } },
        { titulos: { none: {} }, data_vencimento: range },
      ];
    }

    const [despesas, compras, fechamentos] = await Promise.all([
      this.prisma.despesas.findMany({
        where: Object.keys(whereDespesas).length ? whereDespesas : {},
        include: { titulos: { orderBy: { vencimento_em: 'asc' } } },
        orderBy: { data_vencimento: 'asc' },
      }),

      this.prisma.compras.findMany({
        where: whereCompras,
        include: {
          fornecedor: true,
          itens: { select: { nome_produto: true } },
        },
        orderBy: { data_compra: 'asc' },
      }),

      this.prisma.contas_pagar.findMany({
        where: whereContasPagar,
        include: {
          fornecedor: true,
          fornecedor_cobrador: true,
          titulos: { orderBy: { vencimento_em: 'asc' } },
        },
        orderBy: { vencimento_em: 'asc' },
      }),
    ]);

    const rowsDespesas: any[] = [];
    for (const d of despesas) {
      if (d.titulos && d.titulos.length > 0) {
        for (const t of d.titulos) {
          if (status && t.status !== status) continue;
          const venc = new Date(t.vencimento_em);
          venc.setHours(0, 0, 0, 0);
          if (dataIni) {
            const ini = new Date(dataIni);
            ini.setHours(0, 0, 0, 0);
            if (venc < ini) continue;
          }
          if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            if (venc > fim) continue;
          }
          const totalParcelas = Number(t.parcelas_total) || d.titulos.length;
          const numParcela = Number(t.parcela_numero) || 0;
          rowsDespesas.push({
            id: t.id,
            id_despesa: d.id,
            titulo_id: t.id,
            origem: 'DESPESA',
            classificacao_badge: (d as any).classificacao === 'FECHAMENTO' ? 'PRODUÇÃO' : 'OPERACIONAL',
            forma_pagamento_chave: (t as any).tipo ?? null,

            fornecedor_id: null,
            fornecedor_nome: null,

            descricao: d.local || d.categoria,
            observacao: d.classificacao,
            parcela_info:
              totalParcelas > 1
                ? `Parcela ${numParcela}/${totalParcelas}`
                : null,

            valor: t.valor,
            valor_compensado: 0,

            vencimento_em: t.vencimento_em,
            pago_em: t.pago_em,
            status: t.status,

            mes_referencia: null,
            ano_referencia: null,
            cheques_total: 0,
          });
        }
      } else {
        if (status && d.status !== status) continue;
        const vencDesp = new Date(d.data_vencimento);
        vencDesp.setHours(0, 0, 0, 0);
        if (dataIni) {
          const ini = new Date(dataIni);
          ini.setHours(0, 0, 0, 0);
          if (vencDesp < ini) continue;
        }
        if (dataFim) {
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999);
          if (vencDesp > fim) continue;
        }
        rowsDespesas.push({
          id: d.id,
          id_despesa: d.id,
          titulo_id: null,
          origem: 'DESPESA',
          classificacao_badge: (d as any).classificacao === 'FECHAMENTO' ? 'PRODUÇÃO' : 'OPERACIONAL',
          forma_pagamento_chave: (d as any).forma_pagamento ?? null,

          fornecedor_id: null,
          fornecedor_nome: null,

          descricao: d.local || d.categoria,
          observacao: d.classificacao,
          parcela_info: null,

          valor: d.valor_total,
          valor_compensado: 0,

          vencimento_em: d.data_vencimento,
          pago_em: d.data_pagamento,
          status: d.status,

          mes_referencia: null,
          ano_referencia: null,
          cheques_total: 0,
        });
      }
    }

    return [
      ...rowsDespesas,

      // =====================
      // COMPRAS (origem = COMPRA)
      // =====================
      ...compras.map((c) => {
        const itens = (c as any).itens || [];
        const nomesProdutos = itens
          .map((i: any) => i.nome_produto || '')
          .filter(Boolean);
        // Data da compra: usar UTC para evitar dia errado por fuso (ex: 13/02 00:00 UTC → 12/02 no BR)
        let dataCompraStr = '';
        if (c.data_compra) {
          const d = new Date(c.data_compra);
          const day = String(d.getUTCDate()).padStart(2, '0');
          const month = String(d.getUTCMonth() + 1).padStart(2, '0');
          const year = d.getUTCFullYear();
          dataCompraStr = `${day}/${month}/${year}`;
        }
        const parteProdutos =
          nomesProdutos.length > 0
            ? `Produtos: ${nomesProdutos.join(', ')}`
            : c.tipo_compra || 'COMPRA';
        const relatorioDescritivo = dataCompraStr
          ? `COMPRA em ${dataCompraStr} — ${parteProdutos}`
          : `COMPRA — ${parteProdutos}`;

        return {
          id: c.id,
          origem: 'COMPRA',
          classificacao_badge: 'PRODUÇÃO',
          forma_pagamento_chave: null,

          fornecedor_id: c.fornecedor_id,
          fornecedor_nome: c.fornecedor?.nome_fantasia || null,

          descricao: 'COMPRA',
          observacao: c.tipo_compra,
          detalhe_produtos: nomesProdutos,
          data_compra: c.data_compra,
          relatorio_descritivo: relatorioDescritivo,

          valor: c.valor_total,
          valor_compensado: 0,

          vencimento_em: c.vencimento_em,
          pago_em: null,
          status: c.status,

          mes_referencia: null,
          ano_referencia: null,
          cheques_total: 0,
        };
      }),

      // =====================
      // FECHAMENTOS (origem = FECHAMENTO) — exclui os que têm compensado e aguardam quitação (vão para aba Compensados)
      // =====================
      ...fechamentos
        .filter(
          (cp) =>
            Number((cp as any).valor_compensado ?? 0) <= 0 ||
            ((cp as any).status !== SF.EM_ABERTO && (cp as any).status !== SF.VENCIDO),
        )
        .map((cp) => {
          const desc =
            cp.descricao ||
            `Fechamento ${String(cp.mes_referencia).padStart(2, '0')}/${cp.ano_referencia}`;
          const relatorioDescritivo = cp.observacao
            ? `${desc} — ${cp.observacao}`
            : desc;
          const titulos = (cp as any).titulos ?? [];

          return {
            id: cp.id,
            origem: 'FECHAMENTO',
            classificacao_badge: 'PRODUÇÃO',

            fornecedor_id: cp.fornecedor_id,
            fornecedor_nome: cp.fornecedor?.nome_fantasia || null,

            descricao: desc,
            observacao: cp.observacao || null,
            relatorio_descritivo: relatorioDescritivo,

            valor: cp.valor_original,
            valor_compensado: cp.valor_compensado,

            vencimento_em: cp.vencimento_em,
            pago_em: cp.pago_em,
            status: cp.status,

            mes_referencia: cp.mes_referencia,
            ano_referencia: cp.ano_referencia,

            cheques_total: titulos.filter((t: any) => String(t.tipo).toUpperCase() === 'CHEQUE').length,

            fornecedor_cobrador_nome:
              cp.fornecedor_cobrador?.nome_fantasia || null,
            forma_pagamento_chave: cp.forma_pagamento_chave || null,
            titulos_vinculados: titulos.map((t: any) => ({
              id: t.id,
              valor: Number(t.valor ?? 0),
              tipo: t.tipo,
              vencimento_em: t.vencimento_em,
              pago_em: t.pago_em,
              status: t.status,
              parcela_numero: t.parcela_numero,
              parcelas_total: t.parcelas_total,
            })),
          };
        }),
    ].sort((a, b) => {
      const va = a.vencimento_em ? new Date(a.vencimento_em).getTime() : 0;
      const vb = b.vencimento_em ? new Date(b.vencimento_em).getTime() : 0;
      return va - vb;
    });
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
    try {
      const row = await this.prisma.contas_pagar.findUnique({
        where: { id },
        include: {
          fornecedor: true,
          fornecedor_cobrador: true,
          despesa: true,
          titulos: true,
        },
      });
      if (!row) throw new NotFoundException('Conta a pagar não encontrada');
      return row;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Conta a pagar não encontrada');
      }
      throw e;
    }
  }

  async criarContaPagar(dto: any) {
    try {
      return await this.prisma.contas_pagar.create({ data: dto });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Fornecedor ou registro relacionado não encontrado');
        if (e.code === 'P2003') throw new BadRequestException('Referência inválida (fornecedor ou relacionamento).');
      }
      throw e;
    }
  }

  async atualizarContaPagar(id: number, dto: any) {
    try {
      return await this.prisma.contas_pagar.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Conta a pagar não encontrada');
        if (e.code === 'P2003') throw new BadRequestException('Referência inválida.');
      }
      throw e;
    }
  }

  async removerContaPagar(id: number) {
    try {
      return await this.prisma.contas_pagar.delete({ where: { id } });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Conta a pagar não encontrada');
      }
      throw e;
    }
  }

  /**
   * Dar baixa em um título (parcela): marca como PAGO e cria registro em Despesas
   * com data_vencimento/data_compensacao. Usa $transaction para atomicidade.
   * @param dto.data_pagamento opcional - data do pagamento (ISO string); se omitido, usa data atual.
   */
  async pagarTitulo(tituloId: number, dto: { data_pagamento?: string } = {}) {
    return this.prisma.$transaction(async (tx) => {
      const titulo = await tx.titulos_financeiros.findUnique({
        where: { id: tituloId },
        include: { despesa: true, conta_pagar: { include: { fornecedor: true } } },
      });
      if (!titulo) throw new NotFoundException('Título não encontrado');
      if (titulo.status === SF.PAGO) {
        throw new BadRequestException('Este título já está pago.');
      }

      const pagoEm = dto?.data_pagamento ? new Date(dto.data_pagamento) : new Date();
      const valorTitulo = Number((titulo as any).valor ?? 0);
      const formaPagamento = String((titulo as any).tipo ?? 'DINHEIRO').toUpperCase();
      const vencimentoEm = (titulo as any).vencimento_em
        ? new Date((titulo as any).vencimento_em)
        : pagoEm;

      await tx.titulos_financeiros.update({
        where: { id: tituloId },
        data: { status: SF.PAGO, pago_em: pagoEm },
      });

      const cp = (titulo as any).conta_pagar;
      const descricaoLocal =
        cp?.fornecedor?.nome_fantasia
          ? `Pagamento ${formaPagamento} - ${cp.fornecedor.nome_fantasia}`
          : `Pagamento ${formaPagamento}`;

      await tx.despesas.create({
        data: {
          tipo_movimento: 'SAIDA',
          unidade: 'FÁBRICA',
          categoria: 'PAGAMENTO_FORNECEDOR',
          classificacao: cp ? 'FECHAMENTO' : 'OPERACIONAL',
          local: descricaoLocal,
          valor_total: valorTitulo,
          forma_pagamento: formaPagamento,
          quantidade_parcelas: 1,
          data_vencimento: vencimentoEm,
          data_pagamento: pagoEm,
          status: SF.PAGO,
          recorrencia_id: titulo.conta_pagar_id
            ? `CP-TIT-${titulo.conta_pagar_id}-${tituloId}`
            : `TIT-${tituloId}`,
        },
      });

      if (titulo.despesa_id && (titulo as any).despesa) {
        const totalTitulos = await tx.titulos_financeiros.count({
          where: { despesa_id: titulo.despesa_id },
        });
        const titulosPagos = await tx.titulos_financeiros.count({
          where: { despesa_id: titulo.despesa_id, status: SF.PAGO },
        });
        if (totalTitulos === titulosPagos) {
          await tx.despesas.update({
            where: { id: titulo.despesa_id },
            data: { status: SF.PAGO, data_pagamento: pagoEm },
          });
        }
      }

      return { success: true };
    });
  }

  /**
   * Dar baixa em despesa à vista (sem parcelas).
   * @param dto.data_pagamento opcional - data do pagamento (ISO string); se omitido, usa data atual.
   */
  async pagarDespesa(despesaId: number, dto: { data_pagamento?: string } = {}) {
    const despesa = await this.prisma.despesas.findUnique({
      where: { id: despesaId },
      include: { titulos: true },
    });
    if (!despesa) throw new NotFoundException('Despesa não encontrada');
    if (despesa.titulos?.length > 0) {
      throw new BadRequestException(
        'Despesa parcelada: use Contas a Pagar para dar baixa em cada parcela.',
      );
    }
    if (despesa.status === SF.PAGO) {
      throw new BadRequestException('Esta despesa já está paga.');
    }

    const pagoEm = dto?.data_pagamento ? new Date(dto.data_pagamento) : new Date();
    await this.prisma.despesas.update({
      where: { id: despesaId },
      data: { status: SF.PAGO, data_pagamento: pagoEm },
    });
    return { success: true };
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

  // =========================================================
  // ✅ PREVIEW DO FECHAMENTO (ETAPA 1 DO MODAL)
  // Funil: Total Compras (+) - Crédito Acumulado (-) - Serviços Corte (-) - Desconto Negociado (-) = Valor Líquido
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

    const [fornecedor, compras, planos] = await Promise.all([
      this.prisma.fornecedor.findUnique({
        where: { id: fornecedor_id },
        select: { saldo_credito: true },
      }),
      this.prisma.compras.findMany({
        where: {
          fornecedor_id,
          status: SF.EM_ABERTO,
          data_compra: { gte: inicio, lte: fim },
        },
        orderBy: { data_compra: 'asc' },
        select: {
          id: true,
          data_compra: true,
          valor_total: true,
          tipo_compra: true,
          vencimento_em: true,
        },
      }),
      this.prisma.plano_corte.findMany({
        where: {
          fornecedor_id,
          status: { notIn: [SF.COMPENSADO, 'CANCELADO'] },
          data_venda: { gte: inicio, lte: fim },
        },
        orderBy: { data_venda: 'asc' },
        select: {
          id: true,
          data_venda: true,
          valor_total: true,
          status: true,
        },
      }),
    ]);

    const totalCompras = this.round2(
      compras.reduce((s, c) => s + Number((c as any).valor_total || 0), 0),
    );
    const totalPlanos = this.round2(
      planos.reduce((s, p) => s + Number((p as any).valor_total || 0), 0),
    );
    const saldoCreditoAcumulado = this.round2(
      Number((fornecedor as any)?.saldo_credito ?? 0),
    );

    // Funil: base = compras; abate crédito acumulado; abate serviços corte; desconto é aplicado na baixa
    let base = totalCompras;
    const usadoCredito = this.round2(Math.min(saldoCreditoAcumulado, base));
    base = this.round2(Math.max(0, base - usadoCredito));
    const usadoPlanos = this.round2(Math.min(totalPlanos, base));
    base = this.round2(Math.max(0, base - usadoPlanos));
    const valorLiquidoSemDesconto = base;
    const creditoSobraAuto = this.round2(
      Math.max(totalPlanos - usadoPlanos, 0) + Math.max(saldoCreditoAcumulado - usadoCredito, 0),
    );

    const periodo_inicio = inicio.toISOString().slice(0, 10);
    const periodo_fim = fim.toISOString().slice(0, 10);

    return {
      fornecedor_id,
      mes,
      ano,
      periodo_inicio,
      periodo_fim,
      total_compras: totalCompras,
      saldo_credito_acumulado: saldoCreditoAcumulado,
      total_planos: totalPlanos,
      compensado_auto: this.round2(usadoCredito + usadoPlanos),
      valor_liquido_sem_desconto: valorLiquidoSemDesconto,
      credito_sobra_auto: creditoSobraAuto,
      saldo_a_pagar_auto: valorLiquidoSemDesconto,
      historico_compras: compras.map((c) => ({
        id: c.id,
        data_compra: c.data_compra,
        valor_total: Number((c as any).valor_total || 0),
        tipo_compra: (c as any).tipo_compra,
        vencimento_em: (c as any).vencimento_em,
      })),
      historico_planos: planos.map((p) => ({
        id: p.id,
        data_venda: p.data_venda,
        valor_total: Number((p as any).valor_total || 0),
        status: (p as any).status,
      })),
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

    // opcional: se informado, títulos e conta são criados já como PAGO (não precisa dar baixa depois)
    const dataPagamentoStr = String(body?.data_pagamento ?? '').trim();
    let dataPagamento: Date | null = null;
    if (dataPagamentoStr) {
      try {
        dataPagamento = this.toDate(dataPagamentoStr, 'data_pagamento');
      } catch {
        dataPagamento = null;
      }
    }

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
    if (!parcelas.length)
      throw new BadRequestException('parcelas é obrigatório');

    const vencPadraoBody = body?.vencimento_em
      ? this.toDate(body.vencimento_em, 'vencimento_em')
      : new Date(ano, mes, 5);

    for (const p of parcelas) {
      const parcelaNum = Number(p?.parcela || 0);
      const valor = Number(p?.valor || 0);
      const venc = String(p?.vencimento_em || '').trim();

      if (!Number.isFinite(parcelaNum) || parcelaNum <= 0)
        throw new BadRequestException('parcela inválida');
      if (!Number.isFinite(valor) || valor < 0)
        throw new BadRequestException('valor de parcela inválido');
      if (valor > 0 && !venc)
        throw new BadRequestException(
          'vencimento_em obrigatório quando parcela tem valor',
        );
      if (valor === 0 && !venc)
        p.vencimento_em = vencPadraoBody.toISOString().slice(0, 10);
    }

    const vencPadrao = vencPadraoBody;

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

      const fornecedor = await tx.fornecedor.findUnique({
        where: { id: fornecedor_id },
        select: { nome_fantasia: true, razao_social: true, saldo_credito: true },
      });
      const fornecedorNome =
        (fornecedor as any)?.nome_fantasia ||
        (fornecedor as any)?.razao_social ||
        '' ||
        `Fornecedor #${fornecedor_id}`;

      const saldoCreditoAtual = this.round2(
        Number((fornecedor as any)?.saldo_credito ?? 0),
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
          status: { notIn: [SF.COMPENSADO, 'CANCELADO'] },
          data_venda: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      });
      const totalPlanos = this.round2(
        planos.reduce((s, p) => s + Number((p as any).valor_total || 0), 0),
      );
      const credito_extra = this.round2(
        (Math.max(valorCreditar, 0) * pctLiberado) / 100,
      );

      // 2) Funil: Total Compras (+) - Crédito Acumulado (-) - Serviços Corte (-) - Desconto Negociado (-) = Valor Líquido
      let debito_base = this.round2(totalCompras + Math.max(valorDever, 0));
      const usadoCredito = this.round2(Math.min(saldoCreditoAtual, debito_base));
      debito_base = this.round2(Math.max(0, debito_base - usadoCredito));
      const usadoPlanos = this.round2(Math.min(totalPlanos, debito_base));
      debito_base = this.round2(Math.max(0, debito_base - usadoPlanos));
      const usadoCreditoExtra = this.round2(Math.min(credito_extra, debito_base));
      debito_base = this.round2(Math.max(0, debito_base - usadoCreditoExtra));
      const desconto_valor = this.round2((debito_base * descontoPct) / 100);
      const total_final = this.round2(Math.max(0, debito_base - desconto_valor));

      const compensado_total = this.round2(
        usadoCredito + usadoPlanos + usadoCreditoExtra,
      );
      const compensado_auto = this.round2(usadoPlanos);
      const credito_auto = totalPlanos;
      const credito_sobra =
        total_final <= 0
          ? this.round2(
              (saldoCreditoAtual - usadoCredito) +
                (totalPlanos - usadoPlanos) +
                (credito_extra - usadoCreditoExtra),
            )
          : 0;

      const parcelasComValor = parcelas.filter(
        (p: any) => Number(p?.valor || 0) > 0,
      );
      const qtdParcelas = parcelasComValor.length || 1;
      const primeiroVenc =
        parcelasComValor.length > 0 && parcelasComValor[0]?.vencimento_em
          ? this.toDate(parcelasComValor[0].vencimento_em, 'vencimento_em')
          : vencPadrao;
      const statusFinal =
        total_final > 0
          ? dataPagamento
            ? SF.PAGO
            : SF.EM_ABERTO
          : SF.PAGO;
      const pagoEmConta = dataPagamento ?? (total_final <= 0 ? new Date() : null);

      // 2b) Valor Líquido <= 0: zerar dívida e salvar sobra como crédito no fornecedor
      if (total_final <= 0) {
        const novoSaldoCredito = this.round2(
          saldoCreditoAtual - usadoCredito + credito_sobra,
        );
        await tx.fornecedor.update({
          where: { id: fornecedor_id },
          data: { saldo_credito: novoSaldoCredito },
        });
        if (compras.length) {
          await tx.compras.updateMany({
            where: { id: { in: compras.map((c) => c.id) } },
            data: { status: SF.COMPENSADO },
          });
        }
        if (planos.length) {
          await tx.plano_corte.updateMany({
            where: { id: { in: planos.map((p) => p.id) } },
            data: { status: SF.COMPENSADO },
          });
        }
        return {
          fornecedor_id,
          mes,
          ano,
          total_compras: totalCompras,
          total_planos: totalPlanos,
          compensado_total,
          total_final: 0,
          credito_sobra,
          saldo_credito_atualizado: novoSaldoCredito,
          conta_pagar_id: null,
        };
      }

      // 2c) Valor Líquido > 0: abater crédito usado e seguir com criação de títulos/despesas
      await tx.fornecedor.update({
        where: { id: fornecedor_id },
        data: {
          saldo_credito: this.round2(saldoCreditoAtual - usadoCredito),
        },
      });

      // 3a) Cria DESPESA só quando há saldo a pagar (total_final > 0).
      let despesaId: number | null = null;
      {
        const despesa = await tx.despesas.create({
          data: {
            tipo_movimento: 'SAIDA',
            unidade: 'FÁBRICA',
            categoria: 'PAGAMENTO_FORNECEDOR',
            classificacao: 'FECHAMENTO',
            local: `Fechamento ${String(mes).padStart(2, '0')}/${ano} - ${fornecedorNome}`,
            valor_total: total_final,
            forma_pagamento: tipo,
            quantidade_parcelas: qtdParcelas,
            data_vencimento: primeiroVenc,
            data_pagamento: dataPagamento ?? null,
            status: statusFinal,
          },
          select: { id: true },
        });
        despesaId = despesa.id;
      }

      // 3b) Cria FECHAMENTO (contas_pagar), vinculado à despesa apenas se foi criada
      const contaPagar = await tx.contas_pagar.create({
        data: {
          despesa_id: despesaId,
          fornecedor_id,
          fornecedor_cobrador_id: fornecedor_cobrador_id || null,

          mes_referencia: mes,
          ano_referencia: ano,

          descricao: `Fechamento ${String(mes).padStart(2, '0')}/${ano}`,
          observacao: (() => {
            const txt = [
              `AUTO compras=${totalCompras} planos=${totalPlanos} cred_uso=${usadoCredito} planos_uso=${usadoPlanos} comp_total=${compensado_total}`,
              `MANUAL dever=${valorDever} creditar=${valorCreditar} pct=${pctLiberado}% desc=${descontoPct}% desc_val=${desconto_valor}`,
              `total_final=${total_final} PAGTO tipo=${tipo} parcelas=${parcelas.length}`,
            ].join(' | ');
            const maxLen = 191; // VARCHAR(191) na tabela contas_pagar
            return txt.length <= maxLen
              ? txt
              : txt.slice(0, maxLen - 3) + '...';
          })(),

          valor_original: total_final,
          valor_compensado: compensado_total,

          status: statusFinal,
          forma_pagamento_chave: tipo,

          parcelas_total: parcelas.length,
          parcela_numero: null,

          vencimento_em: vencPadrao,
          pago_em: pagoEmConta,
        },
        select: { id: true },
      });

      // 4) cria TITULOS FINANCEIROS (apenas parcelas com valor > 0; saldo 0 = nenhum título)
      if (parcelasComValor.length > 0) {
        const metaJson = {
          fornecedor_id: fornecedor_id ?? null,
          fornecedor_cobrador_id: fornecedor_cobrador_id ?? null,
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
        };
        const statusTitulo = dataPagamento ? SF.PAGO : SF.EM_ABERTO;
        const pagoEmTitulo = dataPagamento ?? null;
        await tx.titulos_financeiros.createMany({
          data: parcelasComValor.map((p: any) => {
            const venc = p.vencimento_em
              ? this.toDate(p.vencimento_em, 'vencimento_em')
              : vencPadrao;
            return {
              conta_pagar_id: contaPagar.id,
              tipo,
              valor: Number(p.valor),
              status: statusTitulo,
              vencimento_em: venc,
              pago_em: pagoEmTitulo,
              parcelas_total: parcelas.length,
              parcela_numero: Number(p.parcela),
              meta: metaJson,
            };
          }),
        });
      }

      // 5) Marca compras e créditos de serviço de corte como COMPENSADOS (ocultos da listagem "Para Fechar")
      if (compras.length) {
        await tx.compras.updateMany({
          where: { id: { in: compras.map((c) => c.id) } },
          data: { status: SF.COMPENSADO },
        });
      }

      if (planos.length) {
        await tx.plano_corte.updateMany({
          where: { id: { in: planos.map((p) => p.id) } },
          data: { status: SF.COMPENSADO },
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
  private async sincronizarContasReceberContratosVigentes() {
    const resolverDadosFinanceirosVenda = (venda: any) => {
      const pagamentos = Array.isArray(venda?.pagamentos)
        ? venda.pagamentos
        : [];
      const somaPagamentos = pagamentos.length
        ? pagamentos.reduce(
            (sum: number, p: any) => sum + Number(p?.valor || 0),
            0,
          )
        : 0;
      const valorVenda = Number(venda?.valor_vendido || venda?.valor_total || 0);
      // Usar sempre o maior: valor da venda (com juros) ou soma das parcelas, para contas a receber refletirem o total a receber
      const valorTotal =
        pagamentos.length > 0
          ? Math.max(somaPagamentos, valorVenda)
          : valorVenda;

      const formas = Array.from(
        new Set(
          pagamentos
            .map((p: any) =>
              String(p?.forma_pagamento_chave || '')
                .trim()
                .toUpperCase(),
            )
            .filter(Boolean),
        ),
      );
      const formaUnica = formas.length === 1 ? formas[0] : null;

      const pagamentosPagos = pagamentos.filter(
        (p: any) =>
          String(p?.status_financeiro_chave || '')
            .trim()
            .toUpperCase() === 'PAGO',
      );
      const recebido =
        pagamentos.length > 0 && pagamentosPagos.length === pagamentos.length;

      const dataRecebido = pagamentosPagos
        .map((p: any) => p?.data_recebimento || null)
        .filter(Boolean)
        .sort((a: any, b: any) => +new Date(b) - +new Date(a))[0];

      const dataVencimento = pagamentos
        .map((p: any) => p?.data_prevista_recebimento || null)
        .filter(Boolean)
        .sort((a: any, b: any) => +new Date(a) - +new Date(b))[0];

      return {
        valorTotal,
        formaUnica,
        recebido,
        dataRecebido: dataRecebido ? new Date(dataRecebido) : null,
        dataVencimento: dataVencimento
          ? new Date(dataVencimento)
          : new Date(venda?.data_venda || new Date()),
      };
    };

    const contratosVigentes = await this.prisma.contratos.findMany({
      where: { status: 'VIGENTE', venda_id: { not: null } },
      select: { venda_id: true, cliente_id: true },
    });

    if (!contratosVigentes.length) return;

    const vendaIds = Array.from(
      new Set(
        contratosVigentes
          .map((c: any) => Number(c?.venda_id || 0))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );
    if (!vendaIds.length) return;

    const contasExistentes = await this.prisma.contas_receber.findMany({
      where: { origem_tipo: 'VENDA', origem_id: { in: vendaIds } },
      select: { origem_id: true },
    });
    const vendasComConta = new Set(
      contasExistentes
        .map((c: any) => Number(c?.origem_id || 0))
        .filter((id: number) => Number.isFinite(id) && id > 0),
    );

    const contratosSemConta = contratosVigentes.filter(
      (c: any) => !vendasComConta.has(Number(c?.venda_id || 0)),
    );
    if (!contratosSemConta.length) return;

    const vendas = await this.prisma.vendas.findMany({
      where: {
        id: {
          in: contratosSemConta
            .map((c: any) => Number(c?.venda_id || 0))
            .filter((id: number) => Number.isFinite(id) && id > 0),
        },
      },
      include: { pagamentos: true },
    });
    const vendaById = new Map<number, any>(
      vendas
        .map((v: any) => [Number(v.id), v] as const)
        .filter(([id]) => Number.isFinite(id) && id > 0),
    );

    const creates: any[] = [];
    for (const c of contratosSemConta) {
      const vendaId = Number((c as any)?.venda_id || 0);
      const clienteId = Number((c as any)?.cliente_id || 0);
      const venda = vendaById.get(vendaId);
      if (!venda) continue;

      const dados = resolverDadosFinanceirosVenda(venda);

      creates.push({
        cliente_id: clienteId > 0 ? clienteId : null,
        origem_tipo: 'VENDA',
        origem_id: vendaId,
        descricao: `Venda #${vendaId}`,
        valor_original: dados.valorTotal,
        valor_compensado: 0,
        status: dados.recebido ? 'PAGO' : 'EM_ABERTO',
        forma_recebimento_chave: dados.formaUnica,
        vencimento_em: dados.dataVencimento,
        recebido_em: dados.recebido ? dados.dataRecebido || new Date() : null,
      });
    }

    if (creates.length) {
      await this.prisma.contas_receber.createMany({ data: creates });
    }

    // Mantém contas existentes coerentes com os pagamentos da venda (forma/status/data).
    const contasVendas = await this.prisma.contas_receber.findMany({
      where: {
        origem_tipo: 'VENDA',
        origem_id: { in: vendaIds },
      },
      select: {
        id: true,
        origem_id: true,
        forma_recebimento_chave: true,
        status: true,
        vencimento_em: true,
        recebido_em: true,
      },
    });

    for (const conta of contasVendas) {
      const vendaId = Number((conta as any).origem_id || 0);
      const venda = vendaById.get(vendaId);
      if (!venda) continue;
      const dados = resolverDadosFinanceirosVenda(venda);

      await this.prisma.contas_receber.update({
        where: { id: (conta as any).id },
        data: {
          forma_recebimento_chave: dados.formaUnica,
          status: dados.recebido ? 'PAGO' : 'EM_ABERTO',
          vencimento_em: dados.dataVencimento,
          recebido_em: dados.recebido
            ? dados.dataRecebido || (conta as any).recebido_em || new Date()
            : null,
        },
      });
    }
  }

  async listarContasReceber(filtros: {
    fornecedor_id?: number;
    cliente_id?: number;
    origem?: string;
    status?: string;
    data_ini?: string;
    data_fim?: string;
  }) {
    await this.sincronizarContasReceberContratosVigentes();

    const normalizeOrigem = (value: any) =>
      String(value || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s-]+/g, '_');

    const origemRaw = normalizeOrigem(filtros.origem);
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

    const contas = await this.prisma.contas_receber.findMany({
      where,
      orderBy: [{ vencimento_em: 'asc' }, { id: 'desc' }],
    });

    const isOrigemPosVenda = (origem: string) =>
      origem.includes('POS') && origem.includes('VENDA');
    const isOrigemVenda = (origem: string) =>
      origem.includes('VENDA') &&
      !origem.includes('PLANO') &&
      !isOrigemPosVenda(origem);

    // Regra do módulo: somente venda/pós-venda; serviço de corte e demais origens ficam fora.
    let contasVendaPosVenda = contas.filter((c: any) => {
      const origem = normalizeOrigem(c?.origem_tipo);
      return isOrigemVenda(origem) || isOrigemPosVenda(origem);
    });

    if (origemRaw === 'VENDA') {
      contasVendaPosVenda = contasVendaPosVenda.filter((c: any) =>
        isOrigemVenda(normalizeOrigem(c?.origem_tipo)),
      );
    } else if (origemRaw === 'POS_VENDA') {
      contasVendaPosVenda = contasVendaPosVenda.filter((c: any) =>
        isOrigemPosVenda(normalizeOrigem(c?.origem_tipo)),
      );
    }

    const vendaIds = Array.from(
      new Set(
        contasVendaPosVenda
          .map((c: any) => Number(c?.origem_id || 0))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );

    const clienteIds = Array.from(
      new Set(
        contasVendaPosVenda
          .map((c: any) => Number(c?.cliente_id || 0))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );

    if (!vendaIds.length && !clienteIds.length) return [];

    const contratosVigentes = await this.prisma.contratos.findMany({
      where: {
        status: 'VIGENTE',
        OR: [
          ...(vendaIds.length ? [{ venda_id: { in: vendaIds } }] : []),
          ...(clienteIds.length ? [{ cliente_id: { in: clienteIds } }] : []),
        ],
      },
      select: { venda_id: true, cliente_id: true },
    });

    const vendaIdsComContrato = new Set(
      contratosVigentes
        .map((c: any) => Number(c?.venda_id || 0))
        .filter((id: number) => Number.isFinite(id) && id > 0),
    );
    const clienteIdsComContrato = new Set(
      contratosVigentes
        .map((c: any) => Number(c?.cliente_id || 0))
        .filter((id: number) => Number.isFinite(id) && id > 0),
    );

    const contasComContrato = contasVendaPosVenda.filter((c: any) => {
      const vendaId = Number(c?.origem_id || 0);
      const clienteId = Number(c?.cliente_id || 0);
      return (
        vendaIdsComContrato.has(vendaId) || clienteIdsComContrato.has(clienteId)
      );
    });

    const vendaIdsContas = Array.from(
      new Set(
        contasComContrato
          .map((c: any) => Number(c?.origem_id || 0))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );

    let pagamentosPorVenda = new Map<number, any[]>();
    if (vendaIdsContas.length) {
      const pagamentos = await this.prisma.vendas_pagamentos.findMany({
        where: { venda_id: { in: vendaIdsContas } },
        orderBy: [
          { data_prevista_recebimento: 'asc' },
          { data_recebimento: 'asc' },
          { id: 'asc' },
        ],
      });
      pagamentosPorVenda = pagamentos.reduce(
        (acc: Map<number, any[]>, p: any) => {
          const vendaId = Number(p?.venda_id || 0);
          if (!vendaId) return acc;
          if (!acc.has(vendaId)) acc.set(vendaId, []);
          acc.get(vendaId).push(p);
          return acc;
        },
        new Map<number, any[]>(),
      );
    }

    let detalhesVendaPorId = new Map<number, any>();
    if (vendaIdsContas.length) {
      const vendas = await this.prisma.vendas.findMany({
        where: { id: { in: vendaIdsContas } },
        include: {
          cliente: {
            select: {
              nome_completo: true,
              razao_social: true,
            },
          },
          itens: {
            select: {
              nome_ambiente: true,
            },
          },
        },
      });
      detalhesVendaPorId = vendas.reduce((acc: Map<number, any>, v: any) => {
        const id = Number(v?.id || 0);
        if (!id) return acc;
        acc.set(id, v);
        return acc;
      }, new Map<number, any>());
    }

    return contasComContrato.map((c: any) => {
      const vendaId = Number(c?.origem_id || 0);
      const pagamentos = pagamentosPorVenda.get(vendaId) || [];
      const venda = detalhesVendaPorId.get(vendaId);
      const parcelas_venda = pagamentos.map((p: any, idx: number) => ({
        parcela: idx + 1,
        valor: Number(p?.valor || 0),
        forma_pagamento_chave: p?.forma_pagamento_chave || null,
        status: p?.status_financeiro_chave || null,
        vencimento_em:
          p?.data_prevista_recebimento || p?.data_recebimento || null,
      }));
      const ambientes_venda = Array.from(
        new Set(
          (venda?.itens || [])
            .map((it: any) => String(it?.nome_ambiente || '').trim())
            .filter(Boolean),
        ),
      );
      const cliente_nome =
        venda?.cliente?.nome_completo || venda?.cliente?.razao_social || null;

      const obs = String(c?.observacao || '');
      const taxaMatch = obs.match(/taxa=([0-9.,-]+)/i);
      const valorTaxaMatch = obs.match(/valor_taxa=([0-9.,-]+)/i);
      const valorLiquidoMatch = obs.match(/valor_liquido=([0-9.,-]+)/i);
      const temAntecipacao = /ANTECIPACAO_CARTAO/i.test(obs);

      return {
        ...c,
        cliente_nome,
        ambientes_venda,
        parcelas_venda,
        antecipacao: temAntecipacao
          ? {
              taxa_percentual: taxaMatch
                ? Number(String(taxaMatch[1]).replace(',', '.'))
                : null,
              valor_taxa: valorTaxaMatch
                ? Number(String(valorTaxaMatch[1]).replace(',', '.'))
                : null,
              valor_liquido: valorLiquidoMatch
                ? Number(String(valorLiquidoMatch[1]).replace(',', '.'))
                : null,
            }
          : null,
      };
    });
  }

  async buscarContaReceber(id: number) {
    try {
      const row = await this.prisma.contas_receber.findUnique({
        where: { id },
        include: {
          fornecedor: true,
          cliente: true,
          compensacoes: true,
          titulos: true,
        },
      });
      if (!row) throw new NotFoundException('Conta a receber não encontrada');
      return row;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Conta a receber não encontrada');
      }
      throw e;
    }
  }

  async criarContaReceber(dto: any) {
    try {
      return await this.prisma.contas_receber.create({ data: dto });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Fornecedor, cliente ou registro relacionado não encontrado');
        if (e.code === 'P2003') throw new BadRequestException('Referência inválida.');
      }
      throw e;
    }
  }

  async removerContaReceber(id: number) {
    try {
      return await this.prisma.contas_receber.delete({ where: { id } });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Conta a receber não encontrada');
      }
      throw e;
    }
  }

  async atualizarContaReceber(id: number, dto: any) {
    try {
      return await this.prisma.contas_receber.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Conta a receber não encontrada');
        if (e.code === 'P2003') throw new BadRequestException('Referência inválida.');
      }
      throw e;
    }
  }

  async receberContaReceber(id: number, dto: any) {
    const { status: _status, recebido_em: _recebidoEm, ...rest } = dto || {};
    const recebidoEm = _recebidoEm ? new Date(_recebidoEm) : new Date();
    try {
      return await this.prisma.contas_receber.update({
        where: { id },
        data: {
          status: SF.PAGO,
          recebido_em: Number.isNaN(recebidoEm.getTime())
            ? new Date()
            : recebidoEm,
          ...rest,
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Conta a receber não encontrada');
      }
      throw e;
    }
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

  /**
   * Listagem por aba: Para Fechar (compras brutas), Compensados (compras/planos já compensados), Agendados (parcelas do fechamento), Pagos (histórico).
   * Compras e créditos de plano usados no fechamento ficam COMPENSADOS e não aparecem em "Para Fechar".
   */
  async listarContasPagarPorAba(filtros: {
    visao: 'PARA_FECHAR' | 'COMPENSADOS' | 'AGENDADOS' | 'PAGOS';
    data_ini?: string;
    data_fim?: string;
  }): Promise<any[]> {
    const visao = filtros.visao;
    let dataIni = filtros.data_ini
      ? new Date(filtros.data_ini + 'T00:00:00')
      : undefined;
    let dataFim = filtros.data_fim
      ? new Date(filtros.data_fim + 'T23:59:59')
      : undefined;
    if (dataIni && !dataFim) {
      dataFim = new Date(
        dataIni.getFullYear(),
        dataIni.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
    }
    if (dataFim && !dataIni) {
      dataIni = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1, 0, 0, 0);
    }

    if (visao === 'PARA_FECHAR') {
      const range = dataIni && dataFim ? { gte: dataIni, lte: dataFim } : undefined;
      const compras = await this.prisma.compras.findMany({
        where: {
          status: SF.EM_ABERTO,
          ...(range ? { data_compra: range } : {}),
        },
        include: {
          fornecedor: true,
          itens: { select: { nome_produto: true } },
        },
        orderBy: { data_compra: 'asc' },
      });
      return compras.map((c) => {
        const itens = (c as any).itens || [];
        const nomesProdutos = itens.map((i: any) => i.nome_produto || '').filter(Boolean);
        let dataCompraStr = '';
        if (c.data_compra) {
          const d = new Date(c.data_compra);
          dataCompraStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
        }
        const parteProdutos = nomesProdutos.length > 0 ? `Produtos: ${nomesProdutos.join(', ')}` : (c as any).tipo_compra || 'COMPRA';
        const relatorioDescritivo = dataCompraStr ? `COMPRA em ${dataCompraStr} — ${parteProdutos}` : `COMPRA — ${parteProdutos}`;
        return {
          id: c.id,
          origem: 'COMPRA',
          fornecedor_id: c.fornecedor_id,
          fornecedor_nome: (c as any).fornecedor?.nome_fantasia || null,
          descricao: 'COMPRA',
          observacao: (c as any).tipo_compra,
          detalhe_produtos: nomesProdutos,
          data_compra: c.data_compra,
          relatorio_descritivo: relatorioDescritivo,
          valor: c.valor_total,
          valor_compensado: 0,
          vencimento_em: c.vencimento_em,
          pago_em: null,
          status: c.status,
          mes_referencia: null,
          ano_referencia: null,
        };
      });
    }

    if (visao === 'COMPENSADOS') {
      const range = dataIni && dataFim ? { gte: dataIni, lte: dataFim } : undefined;
      const [comprasComp, planosComp, fechamentosAguardandoQuitacao] = await Promise.all([
        this.prisma.compras.findMany({
          where: {
            status: SF.COMPENSADO,
            ...(range ? { data_compra: range } : {}),
          },
          include: {
            fornecedor: true,
            itens: { select: { nome_produto: true } },
          },
          orderBy: { data_compra: 'asc' },
        }),
        this.prisma.plano_corte.findMany({
          where: {
            status: SF.COMPENSADO,
            ...(range ? { data_venda: range } : {}),
          },
          include: { fornecedor: true },
          orderBy: { data_venda: 'asc' },
        }),
        this.prisma.contas_pagar.findMany({
          where: {
            valor_compensado: { gt: 0 },
            status: { in: [SF.EM_ABERTO, SF.VENCIDO] },
            ...(range ? { vencimento_em: range } : {}),
          },
          include: {
            fornecedor: true,
            fornecedor_cobrador: true,
            titulos: { where: { status: { in: [SF.EM_ABERTO, SF.VENCIDO] } }, orderBy: { vencimento_em: 'asc' } },
          },
          orderBy: { vencimento_em: 'asc' },
        }),
      ]);
      const rowsCompras = comprasComp.map((c) => {
        const itens = (c as any).itens || [];
        const nomesProdutos = itens.map((i: any) => i.nome_produto || '').filter(Boolean);
        let dataCompraStr = '';
        if (c.data_compra) {
          const d = new Date(c.data_compra);
          dataCompraStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
        }
        const parteProdutos = nomesProdutos.length > 0 ? `Produtos: ${nomesProdutos.join(', ')}` : (c as any).tipo_compra || 'COMPRA';
        const relatorioDescritivo = dataCompraStr ? `COMPRA em ${dataCompraStr} — ${parteProdutos}` : `COMPRA — ${parteProdutos}`;
        return {
          id: c.id,
          origem: 'COMPRA',
          fornecedor_id: c.fornecedor_id,
          fornecedor_nome: (c as any).fornecedor?.nome_fantasia || null,
          descricao: 'COMPRA',
          observacao: (c as any).tipo_compra,
          detalhe_produtos: nomesProdutos,
          data_compra: c.data_compra,
          relatorio_descritivo: relatorioDescritivo,
          valor: c.valor_total,
          valor_compensado: 0,
          vencimento_em: c.vencimento_em,
          pago_em: null,
          status: SF.COMPENSADO,
          mes_referencia: null,
          ano_referencia: null,
        };
      });
      const rowsPlanos = planosComp.map((pc) => {
        const dataVenda = pc.data_venda ? new Date(pc.data_venda) : null;
        const dataVendaStr = dataVenda
          ? `${String(dataVenda.getUTCDate()).padStart(2, '0')}/${String(dataVenda.getUTCMonth() + 1).padStart(2, '0')}/${dataVenda.getUTCFullYear()}`
          : '';
        const desc = dataVendaStr ? `Serviço de Corte — ${dataVendaStr}` : 'Serviço de Corte';
        return {
          id: pc.id,
          origem: 'PLANO_CORTE',
          fornecedor_id: pc.fornecedor_id,
          fornecedor_nome: (pc as any).fornecedor?.nome_fantasia || null,
          descricao: 'Serviço de Corte',
          observacao: desc,
          relatorio_descritivo: desc,
          valor: pc.valor_total,
          valor_compensado: 0,
          vencimento_em: pc.data_venda,
          pago_em: null,
          status: SF.COMPENSADO,
          mes_referencia: null,
          ano_referencia: null,
        };
      });
      const rowsFechamentoAguardando = fechamentosAguardandoQuitacao.flatMap((cp) => {
        const titulos = (cp as any).titulos ?? [];
        const desc = cp.descricao || `Fechamento ${String(cp.mes_referencia).padStart(2, '0')}/${cp.ano_referencia}`;
        return titulos.map((t: any) => ({
          id: t.id,
          titulo_id: t.id,
          conta_pagar_id: cp.id,
          origem: 'FECHAMENTO',
          fornecedor_id: cp.fornecedor_id,
          fornecedor_nome: (cp as any).fornecedor?.nome_fantasia || null,
          descricao: desc,
          observacao: cp.observacao || null,
          relatorio_descritivo: `${desc} — Parcela ${Number(t.parcela_numero) || 1}/${Number(t.parcelas_total) || 1}`,
          valor: t.valor,
          valor_compensado: Number((cp as any).valor_compensado ?? 0),
          vencimento_em: t.vencimento_em,
          pago_em: t.pago_em,
          status: t.status,
          forma_pagamento_chave: cp.forma_pagamento_chave || null,
          parcelas_total: Number(t.parcelas_total) || 1,
          parcela_numero: Number(t.parcela_numero) || 1,
        }));
      });
      return [...rowsCompras, ...rowsPlanos, ...rowsFechamentoAguardando].sort((a, b) => {
        const va = a.vencimento_em ? new Date(a.vencimento_em).getTime() : 0;
        const vb = b.vencimento_em ? new Date(b.vencimento_em).getTime() : 0;
        return va - vb;
      });
    }

    if (visao === 'AGENDADOS') {
      const range = dataIni && dataFim ? { gte: dataIni, lte: dataFim } : undefined;
      const titulos = await this.prisma.titulos_financeiros.findMany({
        where: {
          conta_pagar_id: { not: null },
          conta_pagar: { valor_compensado: { lte: 0 } },
          status: { in: [SF.EM_ABERTO, SF.VENCIDO] },
          ...(range ? { vencimento_em: range } : {}),
        },
        include: {
          conta_pagar: {
            include: { fornecedor: true, fornecedor_cobrador: true },
          },
        },
        orderBy: { vencimento_em: 'asc' },
      });
      return titulos.map((t) => {
        const cp = (t as any).conta_pagar;
        const desc = cp?.descricao || `Fechamento ${cp?.mes_referencia || ''}/${cp?.ano_referencia || ''}`;
        const totalParc = Number(t.parcelas_total) || 1;
        const numParc = Number(t.parcela_numero) || 1;
        return {
          id: t.id,
          titulo_id: t.id,
          conta_pagar_id: cp?.id,
          origem: 'TITULO_FECHAMENTO',
          fornecedor_id: cp?.fornecedor_id ?? null,
          fornecedor_nome: cp?.fornecedor?.nome_fantasia || null,
          descricao: desc,
          observacao: cp?.observacao || null,
          relatorio_descritivo: `${desc} — Parcela ${numParc}/${totalParc}`,
          valor: t.valor,
          valor_compensado: 0,
          vencimento_em: t.vencimento_em,
          pago_em: t.pago_em,
          status: t.status,
          parcelas_total: totalParc,
          parcela_numero: numParc,
          forma_pagamento_chave: cp?.forma_pagamento_chave || null,
        };
      });
    }

    // PAGOS: histórico — titulos de fechamento PAGO + titulos de despesas PAGO
    const rangePago = dataIni && dataFim ? { gte: dataIni, lte: dataFim } : undefined;

    const [titulosPagos, despesasComTitulosPagos] = await Promise.all([
      this.prisma.titulos_financeiros.findMany({
        where: {
          conta_pagar_id: { not: null },
          status: SF.PAGO,
          ...(rangePago ? { pago_em: rangePago } : {}),
        },
        include: {
          conta_pagar: { include: { fornecedor: true } },
        },
        orderBy: { pago_em: 'desc' },
      }),
      this.prisma.despesas.findMany({
        where: {
          titulos: { some: { status: SF.PAGO, ...(rangePago ? { pago_em: rangePago } : {}) } },
        },
        include: { titulos: { where: { status: SF.PAGO }, orderBy: { pago_em: 'desc' } } },
      }),
    ]);

    const rows: any[] = [];

    for (const t of titulosPagos) {
      const cp = (t as any).conta_pagar;
      const desc = cp?.descricao || `Fechamento ${cp?.mes_referencia || ''}/${cp?.ano_referencia || ''}`;
      const totalParc = Number(t.parcelas_total) || 1;
      const numParc = Number(t.parcela_numero) || 1;
      rows.push({
        id: t.id,
        titulo_id: t.id,
        origem: 'TITULO_FECHAMENTO',
        fornecedor_nome: cp?.fornecedor?.nome_fantasia || null,
        descricao: desc,
        relatorio_descritivo: `${desc} — Parcela ${numParc}/${totalParc}`,
        valor: t.valor,
        vencimento_em: t.vencimento_em,
        pago_em: t.pago_em,
        status: SF.PAGO,
      });
    }

    for (const d of despesasComTitulosPagos) {
      const titulosPagosDespesa = (d as any).titulos || [];
      for (const t of titulosPagosDespesa) {
        if (!t.pago_em) continue;
        if (rangePago && (t.pago_em < dataIni! || t.pago_em > dataFim!)) continue;
        const totalParc = titulosPagosDespesa.length || 1;
        const numParc = Number(t.parcela_numero) || 0;
        rows.push({
          id: t.id,
          titulo_id: t.id,
          origem: 'DESPESA',
          fornecedor_nome: null,
          descricao: d.local || d.categoria,
          relatorio_descritivo: totalParc > 1 ? `Parcela ${numParc}/${totalParc}` : (d.local || d.categoria),
          valor: t.valor,
          vencimento_em: t.vencimento_em,
          pago_em: t.pago_em,
          status: SF.PAGO,
        });
      }
    }

    rows.sort((a, b) => {
      const pa = a.pago_em ? new Date(a.pago_em).getTime() : 0;
      const pb = b.pago_em ? new Date(b.pago_em).getTime() : 0;
      return pb - pa;
    });
    return rows;
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
          status: { notIn: [SF.COMPENSADO, 'CANCELADO'] },
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
          data: { status: SF.COMPENSADO },
        });
      }

      if (planos.length) {
        await tx.plano_corte.updateMany({
          where: { id: { in: planos.map((p) => p.id) } },
          data: { status: SF.COMPENSADO },
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

  /**
   * Painel de Obras Vigentes: vigência começa em AGENDAR_MEDIDA_FINA.
   * Saldo e pendência lidos do Contas a Receber (parcelas vencidas até hoje).
   * Se o usuário for vendedor (tem funcionario_id e não é admin), retorna apenas vendas dos seus clientes ou onde é representante.
   */
  async getPainelObrasVigentes(usuario?: {
    funcionario_id?: number | null;
    is_admin?: boolean;
  } | null): Promise<
    Array<{
      venda_id: number;
      contrato_id: number | null;
      cliente_nome: string;
      contrato_numero: string | null;
      status_venda: string;
      valor_total: number;
      total_pago: number;
      saldo_a_receber: number;
      pendencia_financeira: boolean;
      receber_no_ato: boolean;
    }>
  > {
    const statusSet = new Set(
      OBRA_VIGENTE_STATUSES.map((s) => s.toUpperCase()),
    );

    const funcionarioId =
      usuario?.funcionario_id != null && !usuario?.is_admin
        ? Number(usuario.funcionario_id)
        : null;
    const whereVenda: any = {
      status: {
        in: Array.from(statusSet),
      },
    };
    if (funcionarioId != null) {
      whereVenda.AND = [
        {
          OR: [
            { cliente: { vendedor_responsavel_id: funcionarioId } },
            { representante_venda_funcionario_id: funcionarioId },
          ],
        },
      ];
    }

    const vendas = await this.prisma.vendas.findMany({
      where: whereVenda,
      include: {
        cliente: {
          select: {
            id: true,
            nome_completo: true,
            razao_social: true,
            nome_fantasia: true,
          },
        },
        contratos: {
          take: 1,
          orderBy: { id: 'desc' },
          select: { id: true, numero: true, valor: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    const vendaIds = vendas.map((v) => v.id);
    const dataCorte = getDataCorteContasReceber();

    const contas = await this.prisma.contas_receber.findMany({
      where: {
        origem_tipo: 'VENDA',
        origem_id: { in: vendaIds },
      },
      select: {
        origem_id: true,
        valor_original: true,
        valor_compensado: true,
        status: true,
        vencimento_em: true,
      },
    });

    const porVenda: Record<
      number,
      { total_pago: number; saldo: number; pendencia: boolean }
    > = {};
    for (const v of vendas) porVenda[v.id] = { total_pago: 0, saldo: 0, pendencia: false };

    for (const c of contas) {
      const vendaId = Number((c as any).origem_id);
      if (!vendaId || !porVenda[vendaId]) continue;
      const valOrig = Number((c as any).valor_original ?? 0);
      const valComp = Number((c as any).valor_compensado ?? 0);
      const status = String((c as any).status ?? '').toUpperCase();
      const venc = (c as any).vencimento_em ? new Date((c as any).vencimento_em) : null;

      if (status === 'PAGO') {
        porVenda[vendaId].total_pago += valOrig;
      } else {
        porVenda[vendaId].saldo += Math.max(valOrig - valComp, 0);
        if (venc && venc <= dataCorte) porVenda[vendaId].pendencia = true;
      }
    }

    const rows: Array<{
      venda_id: number;
      contrato_id: number | null;
      cliente_nome: string;
      contrato_numero: string | null;
      status_venda: string;
      valor_total: number;
      total_pago: number;
      saldo_a_receber: number;
      pendencia_financeira: boolean;
      receber_no_ato: boolean;
    }> = [];

    for (const v of vendas) {
      const cliente = v.cliente as any;
      const clienteNome =
        cliente?.nome_completo ||
        cliente?.razao_social ||
        cliente?.nome_fantasia ||
        '—';
      const contrato = Array.isArray(v.contratos) ? v.contratos[0] : null;
      const valorTotal = contrato
        ? Number(contrato.valor ?? 0)
        : Number(
            (v as any).valor_base_contrato ?? (v as any).valor_vendido ?? 0,
          );
      const fin = porVenda[v.id] ?? { total_pago: 0, saldo: 0, pendencia: false };
      const totalPago = this.round2(fin.total_pago);
      const saldo = this.round2(fin.saldo);
      const receberNoAto = Boolean((v as any).receber_no_ato_medicao);

      rows.push({
        venda_id: v.id,
        contrato_id: contrato?.id ?? null,
        cliente_nome: clienteNome,
        contrato_numero: contrato?.numero ?? null,
        status_venda: v.status,
        valor_total: this.round2(valorTotal),
        total_pago: totalPago,
        saldo_a_receber: saldo,
        pendencia_financeira: fin.pendencia,
        receber_no_ato: receberNoAto,
      });
    }

    return rows;
  }

  /**
   * DRE Mensal: agrega receita (recebimentos Pix/Cartão/Cheque), CPV materiais e mão de obra.
   */
  async getDreMensal(mes: number, ano: number) {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const formasReceita = ['PIX', 'CREDITO', 'DEBITO', 'CHEQUE'];

    // Receita: contas_receber recebidas no mês (Pix, Cartão, Cheque)
    const contasRecebidas = await this.prisma.contas_receber.findMany({
      where: {
        status: SF.PAGO,
        recebido_em: { gte: inicioMes, lte: fimMes },
        forma_recebimento_chave: { in: formasReceita },
      },
      select: { valor_original: true, valor_compensado: true },
    });
    const receitaBruta =
      contasRecebidas.reduce((s, c) => {
        const v = Number((c as any).valor_compensado ?? (c as any).valor_original ?? 0);
        return s + (v > 0 ? v : Number((c as any).valor_original ?? 0));
      }, 0) || 0;

    // Impostos: placeholder (pode vir de vendas/NF depois)
    const impostos = 0;

    // CPV Materiais: contas_pagar pagas no mês, despesa categoria insumo/matéria-prima OU origem COMPRA (projetos)
    const CATEGORIAS_CPV_MATERIAIS = ['INSUMO', 'MATERIA_PRIMA', 'MATERIA PRIMA', 'INSUMOS'];
    const contasPagarPagas = await this.prisma.contas_pagar.findMany({
      where: {
        status: SF.PAGO,
        pago_em: { gte: inicioMes, lte: fimMes },
        OR: [
          {
            despesa_id: { not: null },
            despesa: {
              categoria: {
                in: CATEGORIAS_CPV_MATERIAIS,
              },
            },
          },
          { origem_tipo: 'COMPRA' },
        ],
      },
      select: { valor_original: true, valor_compensado: true },
    });
    const cpvMateriais = contasPagarPagas.reduce((s, c) => {
      const v = Number((c as any).valor_compensado ?? (c as any).valor_original ?? 0);
      return s + (v > 0 ? v : Number((c as any).valor_original ?? 0));
    }, 0);

    // Despesas Fixas (competência: data_registro no mês). Salários não são somados de novo: o custo apontado por projeto é subdivisão desta despesa.
    const despesasMes = await this.prisma.despesas.findMany({
      where: {
        data_registro: { gte: inicioMes, lte: fimMes },
        categoria: { notIn: CATEGORIAS_CPV_MATERIAIS },
      },
      select: { categoria: true, valor_total: true },
    });
    const categoriasSalario = [...CATEGORIAS_DESPESA_FIXA_SALARIOS];
    let despesasFixasSalarios = 0;
    let despesasFixasOutras = 0;
    for (const d of despesasMes) {
      const v = Number((d as any).valor_total ?? 0);
      const isSalario = categoriasSalario.some(
        (c) => String((d as any).categoria ?? '').toUpperCase() === c.toUpperCase(),
      );
      if (isSalario) despesasFixasSalarios += v;
      else despesasFixasOutras += v;
    }
    despesasFixasSalarios = this.round2(despesasFixasSalarios);
    despesasFixasOutras = this.round2(despesasFixasOutras);
    const despesasFixasTotal = this.round2(despesasFixasSalarios + despesasFixasOutras);

    // Absorção por projetos (informativo): horas Totem × Taxa de Absorção — parte da despesa fixa de salários já contabilizada
    const taxaAbsorcao = await this.custosEstrutura.getTaxaAbsorcaoSalarios(mes, ano);
    const apontamentos = await this.prisma.apontamento_producao.findMany({
      where: { data: { gte: inicioMes, lte: fimMes } },
      select: { horas: true },
    });
    let totalHorasTotem = 0;
    for (const ap of apontamentos) {
      totalHorasTotem += Number((ap as any).horas ?? 0);
    }
    const absorcaoProjetos = this.round2(totalHorasTotem * taxaAbsorcao);

    const cpvTotal = this.round2(cpvMateriais);
    const receita = this.round2(receitaBruta);
    const margemContribuicao = this.round2(receita - impostos - cpvTotal);
    const lucroLiquido = this.round2(margemContribuicao - despesasFixasTotal);

    return {
      mes,
      ano,
      receitaBruta: receita,
      impostos: this.round2(impostos),
      cpvMateriais: this.round2(cpvMateriais),
      cpvTotal,
      despesasFixasSalarios,
      despesasFixasOutras,
      despesasFixasTotal,
      absorcaoProjetos,
      margemContribuicao,
      lucroLiquido,
    };
  }
}
