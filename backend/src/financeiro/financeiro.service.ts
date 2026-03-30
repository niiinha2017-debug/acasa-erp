import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { classificarVendaPorFluxoMatrixOuLegado } from '../shared/constantes/status-matrix';

// ✅ Fonte da verdade dos status (shared)
import { STATUS_FINANCEIRO_KEYS as SF } from '../shared/constantes/status-financeiro';
import { OBRA_VIGENTE_STATUSES } from '../shared/constantes/status-matrix';
import { getDataCorteContasReceber } from '../shared/constantes/status-matrix';
import {
  CustosEstruturaService,
  CATEGORIAS_DESPESA_FIXA_SALARIOS,
} from './custos-estrutura.service';
import { RotaCustoViagemService } from '../rota-custo-viagem/rota-custo-viagem.service';
import type {
  FechamentoFornecedorItem,
  FechamentoFornecedorItemOrigem,
} from './dto/fechamento-fornecedor.dto';
import type { FecharMesFuncionarioDto } from './dto/fechar-mes-funcionario.dto';

@Injectable()
export class FinanceiroService {
  private _ultimaAtualizacaoVencidos: number = 0;
  private readonly _throttleVencidosMs = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly custosEstrutura: CustosEstruturaService,
    private readonly rotaCustoViagem: RotaCustoViagemService,
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
    funcionario_id?: number;
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

    // Garante que dataIni/dataFim sempre cobrem o período correto.
    // Se só data_ini veio, fecha no último dia do mês.
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
    // Se o caller enviou mes/ano mas não data_ini/data_fim, deriva o range para
    // filtrar despesas por data (elas não têm mes_referencia).
    if (filtros.mes != null && filtros.ano != null && !dataIni && !dataFim) {
      dataIni = new Date(filtros.ano, filtros.mes - 1, 1, 0, 0, 0);
      dataFim = new Date(filtros.ano, filtros.mes, 0, 23, 59, 59);
    }

    const whereDespesas: any = {};
    // Unificado: compras compensadas só aparecem na aba Compensados
    const whereCompras: any = status ? { status } : { status: { not: SF.COMPENSADO } };
    const whereContasPagar: any = status ? { status } : {};
    if (fornecedorId != null) {
      whereContasPagar.fornecedor_id = fornecedorId;
      whereCompras.fornecedor_id = fornecedorId;
    }
    if (filtros.funcionario_id != null) {
      whereContasPagar.funcionario_id = filtros.funcionario_id;
      whereDespesas.funcionario_id = filtros.funcionario_id;
      whereCompras.id = -1;
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
          funcionario: true,
          fornecedor_cobrador: true,
          fechamento_funcionario: true,
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
            fornecedor_nome: cp.fornecedor?.nome_fantasia || cp.funcionario?.nome || null,
            funcionario_id: cp.funcionario_id,
            funcionario_nome: cp.funcionario?.nome || null,

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
  // Throttle: executa no máximo 1x por minuto para não sobrecarregar em listagens paralelas.
  // =========================================================
  async atualizarVencidos() {
    const agora = Date.now();
    if (agora - this._ultimaAtualizacaoVencidos < this._throttleVencidosMs) return;
    this._ultimaAtualizacaoVencidos = agora;

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
          funcionario: true,
          fornecedor_cobrador: true,
          fechamento_funcionario: {
            include: { itens: { orderBy: { id: 'asc' } } },
          },
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
          fechamento_id: null,
          regime_financeiro: 'FECHAMENTO_MENSAL',
          data_compra: { gte: inicio, lte: fim },
        },
        orderBy: { data_compra: 'asc' },
        select: {
          id: true,
          data_compra: true,
          valor_total: true,
          tipo_compra: true,
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

    const tipoBody = String(body?.forma_pagamento_chave || '')
      .trim()
      .toUpperCase(); // CHEQUE | CARTAO | BOLETO | ...
    const usarMultiplasFormas = !!body?.usar_multiplas_formas;

    const normalizarTipoTitulo = (tipo?: string) => {
      const t = String(tipo || '').trim().toUpperCase();
      if (!t) return '';
      if (t === 'CREDITO' || t === 'CARTAO') return 'CARTAO';
      return t;
    };

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
      const tipoParcela = normalizarTipoTitulo(
        p?.forma_pagamento_chave || tipoBody,
      );

      if (!Number.isFinite(parcelaNum) || parcelaNum <= 0)
        throw new BadRequestException('parcela inválida');
      if (!Number.isFinite(valor) || valor < 0)
        throw new BadRequestException('valor de parcela inválido');
      if (!tipoParcela)
        throw new BadRequestException(
          'forma_pagamento_chave é obrigatória no fechamento',
        );
      if (valor > 0 && !venc)
        throw new BadRequestException(
          'vencimento_em obrigatório quando parcela tem valor',
        );
      if (valor === 0 && !venc)
        p.vencimento_em = vencPadraoBody.toISOString().slice(0, 10);

      p.forma_pagamento_chave = tipoParcela;
    }

    const vencPadrao = vencPadraoBody;

    return this.prisma.$transaction(async (tx) => {
      // 0) não duplicar fechamento
      const jaExiste = await tx.fornecedor_fechamentos.findFirst({
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
          fechamento_id: null,
          regime_financeiro: 'FECHAMENTO_MENSAL',
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
      const formasPagamentoTitulos: string[] = Array.from(
        new Set(
          parcelasComValor
            .map((p: any) =>
              normalizarTipoTitulo(p?.forma_pagamento_chave || tipoBody),
            )
            .filter(Boolean),
        ),
      );
      const formaConta: string =
        formasPagamentoTitulos.length > 1
          ? 'MISTO'
          : formasPagamentoTitulos[0] || normalizarTipoTitulo(tipoBody) || 'CHEQUE';
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
        const fechamentoCompensado = await tx.fornecedor_fechamentos.create({
          data: {
            fornecedor_id,
            mes_referencia: mes,
            ano_referencia: ano,
            forma_pagamento_chave: formaConta,
            total_compras: totalCompras,
            total_planos: totalPlanos,
            compensado_total,
            desconto_valor,
            valor_dever_manual: Math.max(valorDever, 0),
            valor_creditar_manual: Math.max(valorCreditar, 0),
            valor_final_apurado: 0,
            status: SF.COMPENSADO,
          },
          select: { id: true },
        });

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
            data: {
              status: SF.COMPENSADO,
              fechamento_id: fechamentoCompensado.id,
            },
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
          fechamento_id: fechamentoCompensado.id,
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
            forma_pagamento: formaConta,
            quantidade_parcelas: qtdParcelas,
            data_vencimento: primeiroVenc,
            data_pagamento: dataPagamento ?? null,
            status: statusFinal,
          },
          select: { id: true },
        });
        despesaId = despesa.id;
      }

      const fechamento = await tx.fornecedor_fechamentos.create({
        data: {
          fornecedor_id,
          mes_referencia: mes,
          ano_referencia: ano,
          forma_pagamento_chave: formaConta,
          total_compras: totalCompras,
          total_planos: totalPlanos,
          compensado_total,
          desconto_valor,
          valor_dever_manual: Math.max(valorDever, 0),
          valor_creditar_manual: Math.max(valorCreditar, 0),
          valor_final_apurado: total_final,
          status: statusFinal,
        },
        select: { id: true },
      });

      // 3b) Cria FECHAMENTO (contas_pagar), vinculado à despesa apenas se foi criada
      const contaPagar = await tx.contas_pagar.create({
        data: {
          fechamento_fornecedor_id: fechamento.id,
          despesa_id: despesaId,
          fornecedor_id,
          fornecedor_cobrador_id: fornecedor_cobrador_id || null,

          origem_tipo: 'FORNECEDOR_FECHAMENTO',
          origem_id: fechamento.id,

          mes_referencia: mes,
          ano_referencia: ano,

          descricao: `Fechamento ${String(mes).padStart(2, '0')}/${ano}`,
          observacao: (() => {
            const txt = [
              `AUTO compras=${totalCompras} planos=${totalPlanos} cred_uso=${usadoCredito} planos_uso=${usadoPlanos} comp_total=${compensado_total}`,
              `MANUAL dever=${valorDever} creditar=${valorCreditar} pct=${pctLiberado}% desc=${descontoPct}% desc_val=${desconto_valor}`,
              `total_final=${total_final} PAGTO tipo=${formaConta} parcelas=${parcelas.length} multi=${usarMultiplasFormas ? 'S' : 'N'}`,
            ].join(' | ');
            const maxLen = 191; // VARCHAR(191) na tabela contas_pagar
            return txt.length <= maxLen
              ? txt
              : txt.slice(0, maxLen - 3) + '...';
          })(),

          valor_original: total_final,
          valor_compensado: compensado_total,

          status: statusFinal,
          forma_pagamento_chave: formaConta,

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
          formas_pagamento_titulos: formasPagamentoTitulos,
        };
        const statusTitulo = dataPagamento ? SF.PAGO : SF.EM_ABERTO;
        const pagoEmTitulo = dataPagamento ?? null;
        await tx.titulos_financeiros.createMany({
          data: parcelasComValor.map((p: any) => {
            const venc = p.vencimento_em
              ? this.toDate(p.vencimento_em, 'vencimento_em')
              : vencPadrao;
            const tipoTitulo = normalizarTipoTitulo(
              p?.forma_pagamento_chave || tipoBody || formaConta,
            );
            return {
              conta_pagar_id: contaPagar.id,
              tipo: tipoTitulo,
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
          data: {
            status: SF.COMPENSADO,
            fechamento_id: fechamento.id,
          },
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
        fechamento_id: fechamento.id,
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
    const normalizeOrigem = (value: any) =>
      String(value || '')
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s-]+/g, '_');

    const origemRaw = normalizeOrigem(filtros.origem);
    const whereBase: any = {
      fornecedor_id: filtros.fornecedor_id || undefined,
      cliente_id: filtros.cliente_id || undefined,
      status: filtros.status || undefined,
    };

    const inicioCompetencia = filtros.data_ini
      ? new Date(`${filtros.data_ini}T00:00:00`)
      : null;
    const fimCompetencia = filtros.data_fim
      ? new Date(`${filtros.data_fim}T23:59:59`)
      : null;

    let where: any = whereBase;
    if (inicioCompetencia || fimCompetencia) {
      const faixaCompetencia: any = {};
      if (inicioCompetencia) faixaCompetencia.gte = inicioCompetencia;
      if (fimCompetencia) faixaCompetencia.lte = fimCompetencia;

      const or: any[] = [{ vencimento_em: faixaCompetencia }];
      if (inicioCompetencia) {
        or.push({
          vencimento_em: { lt: inicioCompetencia },
          status: { notIn: ['PAGO', 'RECEBIDO', 'CANCELADO'] },
        });
      }
      where = {
        ...whereBase,
        OR: or,
      };
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
    const isOrigemImportacaoLeitura = (origem: string) =>
      origem === 'IMPORTACAO_LEITURA';

    // Regra do módulo: venda, pós-venda e importação/leitura.
    let contasVendaPosVenda = contas.filter((c: any) => {
      const origem = normalizeOrigem(c?.origem_tipo);
      return (
        isOrigemVenda(origem) ||
        isOrigemPosVenda(origem) ||
        isOrigemImportacaoLeitura(origem)
      );
    });

    if (origemRaw === 'VENDA') {
      contasVendaPosVenda = contasVendaPosVenda.filter((c: any) =>
        isOrigemVenda(normalizeOrigem(c?.origem_tipo)),
      );
    } else if (origemRaw === 'POS_VENDA') {
      contasVendaPosVenda = contasVendaPosVenda.filter((c: any) =>
        isOrigemPosVenda(normalizeOrigem(c?.origem_tipo)),
      );
    } else if (origemRaw === 'IMPORTACAO_LEITURA') {
      contasVendaPosVenda = contasVendaPosVenda.filter((c: any) =>
        isOrigemImportacaoLeitura(normalizeOrigem(c?.origem_tipo)),
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
      const origem = normalizeOrigem(c?.origem_tipo);
      if (isOrigemImportacaoLeitura(origem)) {
        return true;
      }
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

    let detalhesClientePorId = new Map<number, any>();
    if (clienteIds.length) {
      const clientes = await this.prisma.cliente.findMany({
        where: { id: { in: clienteIds } },
        select: {
          id: true,
          nome_completo: true,
          razao_social: true,
        },
      });
      detalhesClientePorId = clientes.reduce((acc: Map<number, any>, cliente: any) => {
        const id = Number(cliente?.id || 0);
        if (!id) return acc;
        acc.set(id, cliente);
        return acc;
      }, new Map<number, any>());
    }

    // Snapshot de markup salvo na OS de importação (prioridade para montar parcelas na tela)
    const clienteIdsContas = Array.from(
      new Set(
        contasComContrato
          .map((c: any) => Number(c?.cliente_id || 0))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );
    const markupPorCliente = new Map<number, any[]>();
    if (clienteIdsContas.length) {
      const osRows = await this.prisma.ordem_servico.findMany({
        where: {
          cliente_id: { in: clienteIdsContas },
          origem: 'IMPORTACAO_LEITURA',
        },
        select: {
          cliente_id: true,
          criado_em: true,
          comissionados: true,
        },
        orderBy: [{ cliente_id: 'asc' }, { criado_em: 'desc' }, { id: 'desc' }],
      });
      for (const os of osRows as any[]) {
        const clienteId = Number(os?.cliente_id || 0);
        if (!clienteId || markupPorCliente.has(clienteId)) continue;
        const payload = os?.comissionados;
        const envelope =
          payload &&
          typeof payload === 'object' &&
          (payload.schema === 'MARKUP_V2' || Array.isArray(payload.parcelas_markup));
        const parcelasMarkup = envelope
          ? Array.isArray(payload?.parcelas_markup)
            ? payload.parcelas_markup
            : []
          : [];
        if (parcelasMarkup.length) {
          markupPorCliente.set(clienteId, parcelasMarkup);
        }
      }
    }

    // Contas de VENDA e POS_VENDA sempre aparecem; apenas IMPORTACAO_LEITURA
    // depende do markup para montar as parcelas (sem markup, oculta só a importação).
    const contasComMarkup = contasComContrato.filter((c: any) => {
      const origem = normalizeOrigem(c?.origem_tipo);
      if (!isOrigemImportacaoLeitura(origem)) return true;
      const clienteId = Number(c?.cliente_id || 0);
      return markupPorCliente.has(clienteId);
    });

    return contasComMarkup.map((c: any) => {
      const origemConta = normalizeOrigem(c?.origem_tipo);
      const isContaImportacaoLeitura = isOrigemImportacaoLeitura(origemConta);
      const vendaId = Number(c?.origem_id || 0);
      const pagamentos = pagamentosPorVenda.get(vendaId) || [];
      const venda = detalhesVendaPorId.get(vendaId);
      const clienteId = Number(c?.cliente_id || 0);
      const statusConta = String(c?.status || '')
        .trim()
        .toUpperCase();
      const statusParcelaConta =
        statusConta === 'PAGO' || statusConta === 'RECEBIDO' ? 'PAGO' : 'EM_ABERTO';
      const parcelasMarkupCliente = markupPorCliente.get(clienteId) || [];
      const valorCompensadoConta = Number(c?.valor_compensado || 0);
      const valorVendaBruto = Number(
        (venda as any)?.valor_vendido ?? (venda as any)?.valor_total ?? 0,
      );

      const parcelas_venda_padrao = pagamentos.map((p: any, idx: number) => ({
        id: Number(p?.id || 0) || null,
        parcela: idx + 1,
        valor: Number(p?.valor || 0),
        forma_pagamento_chave: p?.forma_pagamento_chave || null,
        status: p?.status_financeiro_chave || null,
        vencimento_em:
          p?.data_prevista_recebimento || p?.data_recebimento || null,
      }));
      let parcelas_venda_markup = parcelasMarkupCliente.map((p: any, idx: number) => ({
        id: null,
        parcela: Number(p?.parcela || idx + 1),
        valor: Number(p?.valor || 0),
        forma_pagamento_chave: p?.forma || c?.forma_recebimento_chave || null,
        status: statusParcelaConta,
        vencimento_em: p?.vencimento || null,
      }));

      // Exibição deve refletir valor bruto da venda (não líquido do markup).
      if (parcelas_venda_markup.length && valorVendaBruto > 0) {
        const somaMarkup = parcelas_venda_markup.reduce(
          (s: number, p: any) => s + Number(p?.valor || 0),
          0,
        );
        if (somaMarkup > 0 && Math.abs(somaMarkup - valorVendaBruto) > 0.01) {
          const fator = valorVendaBruto / somaMarkup;
          parcelas_venda_markup = parcelas_venda_markup.map((p: any) => ({
            ...p,
            valor: Math.round((Number(p?.valor || 0) * fator + Number.EPSILON) * 100) / 100,
          }));
          const somaSemUltima = parcelas_venda_markup
            .slice(0, -1)
            .reduce((s: number, p: any) => s + Number(p?.valor || 0), 0);
          const ultima = parcelas_venda_markup[parcelas_venda_markup.length - 1];
          parcelas_venda_markup[parcelas_venda_markup.length - 1] = {
            ...ultima,
            valor:
              Math.round(
                (Math.max(valorVendaBruto - somaSemUltima, 0) + Number.EPSILON) * 100,
              ) / 100,
          };
        }
      }

      // Em conta parcialmente recebida, marca parcelas já baixadas para habilitar "Excluir".
      if (
        parcelas_venda_markup.length &&
        statusParcelaConta === 'EM_ABERTO' &&
        valorCompensadoConta > 0
      ) {
        let saldoCompensado = valorCompensadoConta;
        parcelas_venda_markup = parcelas_venda_markup.map((p: any) => {
          const valorParcela = Number(p?.valor || 0);
          if (saldoCompensado >= valorParcela - 0.01) {
            saldoCompensado -= valorParcela;
            return { ...p, status: 'PAGO' };
          }
          return { ...p, status: 'EM_ABERTO' };
        });
      }

      const matchParcelaDescricao = String(c?.descricao || '').match(/Parcela\s+(\d+)\/(\d+)/i);
      const numeroParcelaAtual = matchParcelaDescricao
        ? Number(matchParcelaDescricao[1] || 0)
        : 0;
      const parcelaAtualMarkup = numeroParcelaAtual
        ? parcelas_venda_markup.find((p: any) => Number(p?.parcela || 0) === numeroParcelaAtual)
        : null;

      const usarMarkup = parcelas_venda_markup.length > 0;
      let parcelas_venda = usarMarkup ? parcelas_venda_markup : parcelas_venda_padrao;
      let valorOriginalFinal = usarMarkup
        ? valorVendaBruto > 0
          ? valorVendaBruto
          : parcelas_venda.reduce((s: number, p: any) => s + Number(p?.valor || 0), 0)
        : Number(c?.valor_original || 0);

      if (isContaImportacaoLeitura) {
        parcelas_venda = parcelaAtualMarkup ? [parcelaAtualMarkup] : [];
        valorOriginalFinal = Number(
          c?.valor_original ?? parcelaAtualMarkup?.valor ?? 0,
        );
      }

      const ambientes_venda = Array.from(
        new Set(
          (venda?.itens || [])
            .map((it: any) => String(it?.nome_ambiente || '').trim())
            .filter(Boolean),
        ),
      );
      const clienteConta = detalhesClientePorId.get(clienteId);
      const cliente_nome =
        venda?.cliente?.nome_completo ||
        venda?.cliente?.razao_social ||
        clienteConta?.nome_completo ||
        clienteConta?.razao_social ||
        null;

      const obs = String(c?.observacao || '');
      const taxaMatch = obs.match(/taxa=([0-9.,-]+)/i);
      const valorTaxaMatch = obs.match(/valor_taxa=([0-9.,-]+)/i);
      const valorLiquidoMatch = obs.match(/valor_liquido=([0-9.,-]+)/i);
      const temAntecipacao = /ANTECIPACAO_CARTAO/i.test(obs);

      return {
        ...c,
        valor_original: valorOriginalFinal,
        valor_compensado: Number(c?.valor_compensado || 0),
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
    const {
      status: _status,
      recebido_em: _recebidoEm,
      venda_pagamento_id: _vendaPagamentoId,
      parcela: _parcela,
      ...rest
    } = dto || {};
    const recebidoEm = _recebidoEm ? new Date(_recebidoEm) : new Date();
    const vendaPagamentoId = Number(_vendaPagamentoId || 0);
    const parcelaNumero = Number(_parcela || 0);
    const recebidoEmFinal = Number.isNaN(recebidoEm.getTime()) ? new Date() : recebidoEm;

    const normalizarStatus = (value: any) =>
      String(value || '')
        .trim()
        .toUpperCase();
    try {
      const conta = await this.prisma.contas_receber.findUnique({
        where: { id },
      });
      if (!conta) throw new NotFoundException('Conta a receber não encontrada');

      const origemTipoConta = normalizarStatus((conta as any).origem_tipo);
      const origemIdConta = Number((conta as any).origem_id || 0);

      // Baixa por parcela de venda: atualiza somente a parcela e recalcula a conta.
      if (vendaPagamentoId > 0 || parcelaNumero > 0) {
        if (!origemTipoConta.includes('VENDA') || !origemIdConta) {
          throw new BadRequestException(
            'Baixa por parcela disponível apenas para contas com origem VENDA.',
          );
        }

        const pagamentos = await this.prisma.vendas_pagamentos.findMany({
          where: { venda_id: origemIdConta },
          orderBy: [
            { data_prevista_recebimento: 'asc' },
            { id: 'asc' },
          ],
        });
        if (!pagamentos.length) {
          throw new BadRequestException('Não há parcelas cadastradas para esta venda.');
        }

        const pagamentoAlvo =
          vendaPagamentoId > 0
            ? pagamentos.find((p: any) => Number(p?.id || 0) === vendaPagamentoId)
            : pagamentos[parcelaNumero - 1];

        if (!pagamentoAlvo) {
          throw new BadRequestException('Parcela não encontrada para baixa.');
        }

        await this.prisma.vendas_pagamentos.update({
          where: { id: Number((pagamentoAlvo as any).id) },
          data: {
            status_financeiro_chave: SF.PAGO,
            data_recebimento: recebidoEmFinal,
            forma_pagamento_chave: rest?.forma_recebimento_chave
              ? String(rest.forma_recebimento_chave).trim().toUpperCase()
              : undefined,
          },
        });

        const pagamentosAtualizados = await this.prisma.vendas_pagamentos.findMany({
          where: { venda_id: origemIdConta },
        });
        const pagamentosPagos = pagamentosAtualizados.filter(
          (p: any) => normalizarStatus(p?.status_financeiro_chave) === SF.PAGO,
        );
        const valorCompensado = pagamentosPagos.reduce(
          (sum: number, p: any) => sum + Number(p?.valor || 0),
          0,
        );
        const todosPagos =
          pagamentosAtualizados.length > 0 &&
          pagamentosPagos.length === pagamentosAtualizados.length;
        const dataRecebimentoFinal = pagamentosPagos
          .map((p: any) => p?.data_recebimento || null)
          .filter(Boolean)
          .sort((a: any, b: any) => +new Date(b) - +new Date(a))[0];

        return await this.prisma.contas_receber.update({
          where: { id },
          data: {
            status: todosPagos ? SF.PAGO : SF.EM_ABERTO,
            recebido_em: todosPagos
              ? dataRecebimentoFinal
                ? new Date(dataRecebimentoFinal)
                : recebidoEmFinal
              : null,
            valor_compensado: valorCompensado as any,
            ...rest,
          },
        });
      }

      // Proteção: venda parcelada não pode ser baixada em lote por este endpoint.
      if (origemTipoConta.includes('VENDA') && origemIdConta > 0) {
        const qtdParcelas = await this.prisma.vendas_pagamentos.count({
          where: { venda_id: origemIdConta },
        });
        if (qtdParcelas > 0) {
          throw new BadRequestException(
            'Esta venda possui parcelas. Faça a baixa por parcela.',
          );
        }
      }

      return await this.prisma.contas_receber.update({
        where: { id },
        data: {
          status: SF.PAGO,
          recebido_em: recebidoEmFinal,
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

  async estornarContaReceber(id: number, dto: any) {
    const {
      venda_pagamento_id: _vendaPagamentoId,
      parcela: _parcela,
      ...rest
    } = dto || {};
    const vendaPagamentoId = Number(_vendaPagamentoId || 0);
    const parcelaNumero = Number(_parcela || 0);

    const normalizarStatus = (value: any) =>
      String(value || '')
        .trim()
        .toUpperCase();

    try {
      const conta = await this.prisma.contas_receber.findUnique({
        where: { id },
      });
      if (!conta) throw new NotFoundException('Conta a receber não encontrada');

      const origemTipoConta = normalizarStatus((conta as any).origem_tipo);
      const origemIdConta = Number((conta as any).origem_id || 0);

      // Estorno por parcela de venda.
      if (vendaPagamentoId > 0 || parcelaNumero > 0) {
        if (!origemTipoConta.includes('VENDA') || !origemIdConta) {
          throw new BadRequestException(
            'Estorno por parcela disponível apenas para contas com origem VENDA.',
          );
        }

        const pagamentos = await this.prisma.vendas_pagamentos.findMany({
          where: { venda_id: origemIdConta },
          orderBy: [
            { data_prevista_recebimento: 'asc' },
            { id: 'asc' },
          ],
        });
        if (!pagamentos.length) {
          throw new BadRequestException('Não há parcelas cadastradas para esta venda.');
        }

        const pagamentoAlvo =
          vendaPagamentoId > 0
            ? pagamentos.find((p: any) => Number(p?.id || 0) === vendaPagamentoId)
            : pagamentos[parcelaNumero - 1];

        if (!pagamentoAlvo) {
          throw new BadRequestException('Parcela não encontrada para estorno.');
        }

        await this.prisma.vendas_pagamentos.update({
          where: { id: Number((pagamentoAlvo as any).id) },
          data: {
            status_financeiro_chave: SF.EM_ABERTO,
            data_recebimento: null,
          },
        });

        const pagamentosAtualizados = await this.prisma.vendas_pagamentos.findMany({
          where: { venda_id: origemIdConta },
        });
        const pagamentosPagos = pagamentosAtualizados.filter(
          (p: any) => normalizarStatus(p?.status_financeiro_chave) === SF.PAGO,
        );
        const valorCompensado = pagamentosPagos.reduce(
          (sum: number, p: any) => sum + Number(p?.valor || 0),
          0,
        );
        const todosPagos =
          pagamentosAtualizados.length > 0 &&
          pagamentosPagos.length === pagamentosAtualizados.length;
        const dataRecebimentoFinal = pagamentosPagos
          .map((p: any) => p?.data_recebimento || null)
          .filter(Boolean)
          .sort((a: any, b: any) => +new Date(b) - +new Date(a))[0];

        return await this.prisma.contas_receber.update({
          where: { id },
          data: {
            status: todosPagos ? SF.PAGO : SF.EM_ABERTO,
            recebido_em: todosPagos && dataRecebimentoFinal ? new Date(dataRecebimentoFinal) : null,
            valor_compensado: valorCompensado as any,
            ...rest,
          },
        });
      }

      // Proteção: venda parcelada deve ser estornada por parcela.
      if (origemTipoConta.includes('VENDA') && origemIdConta > 0) {
        const qtdParcelas = await this.prisma.vendas_pagamentos.count({
          where: { venda_id: origemIdConta },
        });
        if (qtdParcelas > 0) {
          throw new BadRequestException(
            'Esta venda possui parcelas. Faça o estorno por parcela.',
          );
        }
      }

      return await this.prisma.contas_receber.update({
        where: { id },
        data: {
          status: SF.EM_ABERTO,
          recebido_em: null,
          valor_compensado: 0 as any,
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
    funcionario_id?: number;
    status?: string;
    data_ini?: string;
    data_fim?: string;
  }) {
    const where: any = {
      fornecedor_id: filtros.fornecedor_id || undefined,
      funcionario_id: filtros.funcionario_id || undefined,
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
        funcionario: true,
        fornecedor_cobrador: true,
        fechamento_funcionario: true,
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
    fornecedor_id?: number;
    funcionario_id?: number;
    mes?: number;
    ano?: number;
  }): Promise<any[]> {
    const visao = filtros.visao;
    const fornecedorId = filtros.fornecedor_id;
    const funcionarioId = filtros.funcionario_id;
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

    const temCompetencia =
      Number.isFinite(filtros.mes) && Number.isFinite(filtros.ano);

    // Se o caller passou mes/ano mas não data_ini/data_fim, deriva o range do mês para
    // filtrar compras e despesas por data (esses campos não têm mes_referencia).
    if (temCompetencia && !dataIni && !dataFim) {
      dataIni = new Date(filtros.ano!, filtros.mes! - 1, 1, 0, 0, 0);
      dataFim = new Date(filtros.ano!, filtros.mes!, 0, 23, 59, 59);
    }

    const range = dataIni && dataFim ? { gte: dataIni, lte: dataFim } : undefined;
    const filtroContaPagarCompetencia = temCompetencia
      ? {
          mes_referencia: filtros.mes,
          ano_referencia: filtros.ano,
        }
      : {};
    const incluirDespesas = fornecedorId == null;
    const statusAbertos = [SF.EM_ABERTO, SF.VENCIDO];

    if (visao === 'PARA_FECHAR') {
      const compras = await this.prisma.compras.findMany({
        where: {
          status: SF.EM_ABERTO,
          ...(fornecedorId != null ? { fornecedor_id: fornecedorId } : {}),
          ...(funcionarioId != null ? { id: -1 } : {}),
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
      const [comprasComp, planosComp, fechamentosAguardandoQuitacao] = await Promise.all([
        this.prisma.compras.findMany({
          where: {
            status: SF.COMPENSADO,
            ...(fornecedorId != null ? { fornecedor_id: fornecedorId } : {}),
            ...(funcionarioId != null ? { id: -1 } : {}),
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
            ...(fornecedorId != null ? { fornecedor_id: fornecedorId } : {}),
            ...(funcionarioId != null ? { id: -1 } : {}),
            ...(range ? { data_venda: range } : {}),
          },
          include: { fornecedor: true },
          orderBy: { data_venda: 'asc' },
        }),
        this.prisma.contas_pagar.findMany({
          where: {
            valor_compensado: { gt: 0 },
            status: { in: [SF.EM_ABERTO, SF.VENCIDO] },
            ...(fornecedorId != null ? { fornecedor_id: fornecedorId } : {}),
            ...(funcionarioId != null ? { funcionario_id: funcionarioId } : {}),
            ...filtroContaPagarCompetencia,
            ...(!temCompetencia && range ? { vencimento_em: range } : {}),
          },
          include: {
            fornecedor: true,
            funcionario: true,
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
          fornecedor_nome: (cp as any).fornecedor?.nome_fantasia || (cp as any).funcionario?.nome || null,
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
      const [titulosContaPagar, despesasAbertas] = await Promise.all([
        this.prisma.titulos_financeiros.findMany({
          where: {
            conta_pagar_id: { not: null },
            conta_pagar: {
              valor_compensado: { lte: 0 },
              ...(fornecedorId != null ? { fornecedor_id: fornecedorId } : {}),
              ...(funcionarioId != null ? { funcionario_id: funcionarioId } : {}),
              ...filtroContaPagarCompetencia,
            },
            status: { in: statusAbertos },
            ...(!temCompetencia && range ? { vencimento_em: range } : {}),
          },
          include: {
            conta_pagar: {
              include: { fornecedor: true, funcionario: true, fornecedor_cobrador: true },
            },
          },
          orderBy: { vencimento_em: 'asc' },
        }),
        incluirDespesas
          ? this.prisma.despesas.findMany({
              where: {
                ...(funcionarioId != null ? { funcionario_id: funcionarioId } : {}),
                ...(range
                  ? {
                      OR: [
                        {
                          titulos: {
                            some: {
                              status: { in: statusAbertos },
                              vencimento_em: range,
                            },
                          },
                        },
                        {
                          titulos: { none: {} },
                          status: { in: statusAbertos },
                          data_vencimento: range,
                        },
                      ],
                    }
                  : {
                      OR: [
                        { titulos: { some: { status: { in: statusAbertos } } } },
                        { titulos: { none: {} }, status: { in: statusAbertos } },
                      ],
                    }),
              },
              include: {
                titulos: {
                  where: {
                    status: { in: statusAbertos },
                    ...(range ? { vencimento_em: range } : {}),
                  },
                  orderBy: { vencimento_em: 'asc' },
                },
              },
              orderBy: { data_vencimento: 'asc' },
            })
          : Promise.resolve([] as any[]),
      ]);

      const rowsTitulosContaPagar = titulosContaPagar.map((t) => {
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
          fornecedor_nome: cp?.fornecedor?.nome_fantasia || cp?.funcionario?.nome || null,
          funcionario_id: cp?.funcionario_id ?? null,
          funcionario_nome: cp?.funcionario?.nome || null,
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

      const rowsDespesas: any[] = [];
      for (const d of despesasAbertas) {
        const titulos = (d as any).titulos ?? [];
        if (titulos.length > 0) {
          for (const t of titulos) {
            const totalParc = Number(t.parcelas_total) || titulos.length || 1;
            const numParc = Number(t.parcela_numero) || 1;
            rowsDespesas.push({
              id: t.id,
              id_despesa: d.id,
              titulo_id: t.id,
              origem: 'DESPESA',
              classificacao_badge: (d as any).classificacao === 'FECHAMENTO' ? 'PRODUÇÃO' : 'OPERACIONAL',
              forma_pagamento_chave: (t as any).tipo ?? null,
              fornecedor_id: null,
              fornecedor_nome: null,
              funcionario_id: (d as any).funcionario_id ?? null,
              descricao: d.local || d.categoria,
              observacao: d.classificacao,
              relatorio_descritivo:
                totalParc > 1 ? `${d.local || d.categoria} — Parcela ${numParc}/${totalParc}` : (d.local || d.categoria),
              valor: t.valor,
              valor_compensado: 0,
              vencimento_em: t.vencimento_em,
              pago_em: t.pago_em,
              status: t.status,
              parcelas_total: totalParc,
              parcela_numero: numParc,
            });
          }
          continue;
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
          funcionario_id: (d as any).funcionario_id ?? null,
          descricao: d.local || d.categoria,
          observacao: d.classificacao,
          relatorio_descritivo: d.local || d.categoria,
          valor: d.valor_total,
          valor_compensado: 0,
          vencimento_em: d.data_vencimento,
          pago_em: d.data_pagamento,
          status: d.status,
          parcelas_total: 1,
          parcela_numero: 1,
        });
      }

      return [...rowsTitulosContaPagar, ...rowsDespesas].sort((a, b) => {
        const va = a.vencimento_em ? new Date(a.vencimento_em).getTime() : 0;
        const vb = b.vencimento_em ? new Date(b.vencimento_em).getTime() : 0;
        return va - vb;
      });
    }

    // PAGOS: histórico — titulos de fechamento PAGO + titulos de despesas PAGO
    const rangePago = dataIni && dataFim ? { gte: dataIni, lte: dataFim } : undefined;

    const [titulosPagos, despesasPagas] = await Promise.all([
      this.prisma.titulos_financeiros.findMany({
        where: {
          conta_pagar_id: { not: null },
          conta_pagar: {
            ...(fornecedorId != null ? { fornecedor_id: fornecedorId } : {}),
            ...(funcionarioId != null ? { funcionario_id: funcionarioId } : {}),
            ...filtroContaPagarCompetencia,
          },
          status: SF.PAGO,
          ...(!temCompetencia && rangePago ? { pago_em: rangePago } : {}),
        },
        include: {
          conta_pagar: { include: { fornecedor: true, funcionario: true } },
        },
        orderBy: { pago_em: 'desc' },
      }),
      incluirDespesas
        ? this.prisma.despesas.findMany({
            where: {
              ...(funcionarioId != null ? { funcionario_id: funcionarioId } : {}),
              OR: [
                {
                  titulos: {
                    some: {
                      status: SF.PAGO,
                      ...(rangePago ? { pago_em: rangePago } : {}),
                    },
                  },
                },
                {
                  titulos: { none: {} },
                  status: SF.PAGO,
                  ...(rangePago ? { data_pagamento: rangePago } : {}),
                },
              ],
            },
            include: {
              titulos: {
                where: {
                  status: SF.PAGO,
                  ...(rangePago ? { pago_em: rangePago } : {}),
                },
                orderBy: { pago_em: 'desc' },
              },
            },
            orderBy: { data_pagamento: 'desc' },
          })
        : Promise.resolve([] as any[]),
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
        fornecedor_nome: cp?.fornecedor?.nome_fantasia || cp?.funcionario?.nome || null,
        funcionario_nome: cp?.funcionario?.nome || null,
        descricao: desc,
        relatorio_descritivo: `${desc} — Parcela ${numParc}/${totalParc}`,
        valor: t.valor,
        vencimento_em: t.vencimento_em,
        pago_em: t.pago_em,
        status: SF.PAGO,
      });
    }

    for (const d of despesasPagas) {
      const titulosPagosDespesa = (d as any).titulos || [];
      if (titulosPagosDespesa.length > 0) {
        for (const t of titulosPagosDespesa) {
          if (!t.pago_em) continue;
          if (rangePago && (t.pago_em < dataIni! || t.pago_em > dataFim!)) continue;
          const totalParc = titulosPagosDespesa.length || 1;
          const numParc = Number(t.parcela_numero) || 0;
          rows.push({
            id: t.id,
            titulo_id: t.id,
            id_despesa: d.id,
            origem: 'DESPESA',
            fornecedor_nome: null,
            funcionario_id: (d as any).funcionario_id ?? null,
            descricao: d.local || d.categoria,
            relatorio_descritivo: totalParc > 1 ? `Parcela ${numParc}/${totalParc}` : (d.local || d.categoria),
            valor: t.valor,
            vencimento_em: t.vencimento_em,
            pago_em: t.pago_em,
            status: SF.PAGO,
          });
        }
        continue;
      }

      rows.push({
        id: d.id,
        id_despesa: d.id,
        titulo_id: null,
        origem: 'DESPESA',
        fornecedor_nome: null,
        funcionario_id: (d as any).funcionario_id ?? null,
        descricao: d.local || d.categoria,
        relatorio_descritivo: d.local || d.categoria,
        valor: d.valor_total,
        vencimento_em: d.data_vencimento,
        pago_em: d.data_pagamento,
        status: SF.PAGO,
      });
    }

    rows.sort((a, b) => {
      const pa = a.pago_em ? new Date(a.pago_em).getTime() : 0;
      const pb = b.pago_em ? new Date(b.pago_em).getTime() : 0;
      return pb - pa;
    });
    return rows;
  }

  async fecharMesFuncionario(body: FecharMesFuncionarioDto) {
    const funcionario_id = this.toNumber(body?.funcionario_id, 'funcionario_id');
    const mes = this.toNumber(body?.mes, 'mes');
    const ano = this.toNumber(body?.ano, 'ano');

    const toMoney = (v: unknown) => this.round2(Number(v ?? 0));

    return this.prisma.$transaction(async (tx) => {
      const jaExiste = await tx.funcionario_fechamentos.findFirst({
        where: { funcionario_id, mes_referencia: mes, ano_referencia: ano },
        select: { id: true },
      });
      if (jaExiste) {
        throw new BadRequestException('Já existe fechamento deste funcionário para o mês/ano.');
      }

      const funcionario = await tx.funcionarios.findUnique({
        where: { id: funcionario_id },
        select: {
          id: true,
          nome: true,
          salario_base: true,
          salario_adicional: true,
          vale: true,
          vale_transporte: true,
          forma_pagamento: true,
          dia_pagamento: true,
        },
      });
      if (!funcionario) {
        throw new NotFoundException('Funcionário não encontrado.');
      }

      const salarioBase = toMoney(body?.salario_base ?? funcionario.salario_base ?? 0);
      const salarioAdicional = toMoney(
        body?.salario_adicional ?? funcionario.salario_adicional ?? 0,
      );
      const beneficios = toMoney(
        body?.beneficios ?? Number(funcionario.vale ?? 0) + Number(funcionario.vale_transporte ?? 0),
      );
      const horasExtrasValor = toMoney(body?.horas_extras_valor ?? 0);
      const descontos = toMoney(body?.descontos ?? 0);

      const valorBruto = this.round2(salarioBase + salarioAdicional + beneficios + horasExtrasValor);
      const valorLiquido = this.round2(Math.max(0, valorBruto - descontos));

      const forma = String(
        body?.forma_pagamento_chave || funcionario.forma_pagamento || 'PIX',
      )
        .trim()
        .toUpperCase();
      const diaPagamento = Number(body?.dia_pagamento ?? funcionario.dia_pagamento ?? 5);
      const vencimento = body?.vencimento_em
        ? this.toDate(body.vencimento_em, 'vencimento_em')
        : new Date(ano, mes - 1, Math.min(Math.max(diaPagamento, 1), 28), 12, 0, 0);

      const dataPagamento = body?.data_pagamento
        ? this.toDate(body.data_pagamento, 'data_pagamento')
        : null;
      const statusFinal = dataPagamento ? SF.PAGO : SF.EM_ABERTO;
      const dataRegistroDespesa = new Date(
        ano,
        mes - 1,
        Math.min(Math.max(diaPagamento, 1), 28),
        12,
        0,
        0,
      );

      const fechamento = await tx.funcionario_fechamentos.create({
        data: {
          funcionario_id,
          mes_referencia: mes,
          ano_referencia: ano,
          forma_pagamento_chave: forma,
          dia_pagamento_snapshot: diaPagamento,
          salario_base_snapshot: salarioBase,
          salario_adicional_snapshot: salarioAdicional,
          beneficios_snapshot: beneficios,
          descontos_snapshot: descontos,
          horas_extras_valor: horasExtrasValor,
          valor_bruto: valorBruto,
          valor_liquido: valorLiquido,
          status: statusFinal,
          observacao: body?.observacao || null,
          itens: {
            create: [
              { tipo_item: 'PROVENTO', rubrica: 'SALARIO_BASE', valor: salarioBase, ordem: 1 },
              { tipo_item: 'PROVENTO', rubrica: 'SALARIO_ADICIONAL', valor: salarioAdicional, ordem: 2 },
              { tipo_item: 'PROVENTO', rubrica: 'BENEFICIOS', valor: beneficios, ordem: 3 },
              { tipo_item: 'PROVENTO', rubrica: 'HORA_EXTRA', valor: horasExtrasValor, ordem: 4 },
              { tipo_item: 'DESCONTO', rubrica: 'DESCONTOS', valor: descontos, ordem: 5 },
              ...((body?.itens || []).map((item, idx) => ({
                tipo_item: String(item.tipo_item || '').toUpperCase(),
                rubrica: String(item.rubrica || '').toUpperCase(),
                valor: toMoney(item.valor),
                observacao: item.observacao || null,
                ordem: idx + 10,
              })) as any[]),
            ],
          },
        },
        select: { id: true },
      });

      let despesaId: number | null = null;
      if (valorLiquido > 0) {
        const despesa = await tx.despesas.create({
          data: {
            tipo_movimento: 'SAIDA',
            unidade: 'MATRIZ',
            categoria: 'FOLHA',
            classificacao: 'FECHAMENTO',
            local: `Fechamento ${String(mes).padStart(2, '0')}/${ano} - ${funcionario.nome}`,
            valor_total: valorLiquido,
            forma_pagamento: forma,
            quantidade_parcelas: 1,
            data_registro: dataRegistroDespesa,
            data_vencimento: vencimento,
            data_pagamento: dataPagamento,
            status: statusFinal,
            funcionario_id,
          },
          select: { id: true },
        });
        despesaId = despesa.id;
      }

      const contaPagar = await tx.contas_pagar.create({
        data: {
          despesa_id: despesaId,
          funcionario_id,
          fechamento_funcionario_id: fechamento.id,
          origem_tipo: 'FUNCIONARIO_FECHAMENTO',
          origem_id: fechamento.id,
          mes_referencia: mes,
          ano_referencia: ano,
          descricao: `Fechamento funcionário ${funcionario.nome} - ${String(mes).padStart(2, '0')}/${ano}`,
          observacao: body?.observacao || null,
          valor_original: valorLiquido,
          valor_compensado: 0,
          status: statusFinal,
          forma_pagamento_chave: forma,
          parcelas_total: 1,
          parcela_numero: 1,
          vencimento_em: vencimento,
          pago_em: dataPagamento,
        },
        select: { id: true },
      });

      await tx.titulos_financeiros.create({
        data: {
          conta_pagar_id: contaPagar.id,
          tipo: forma,
          valor: valorLiquido,
          status: statusFinal,
          vencimento_em: vencimento,
          pago_em: dataPagamento,
          parcelas_total: 1,
          parcela_numero: 1,
          meta: {
            origem: 'FUNCIONARIO_FECHAMENTO',
            funcionario_id,
            fechamento_id: fechamento.id,
            mes,
            ano,
          },
        },
      });

      return {
        funcionario_id,
        fechamento_id: fechamento.id,
        conta_pagar_id: contaPagar.id,
        valor_bruto: valorBruto,
        valor_liquido: valorLiquido,
        status: statusFinal,
      };
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

    const agendasObra = await this.prisma.agenda_fabrica.findMany({
      where: {
        venda_id: { not: null },
        status: { not: 'CANCELADO' },
        macroetapa: { in: ['ENGENHARIA', 'FABRICA', 'LOGISTICA', 'POS_VENDA'] },
      },
      select: {
        venda_id: true,
        subetapa: true,
        execucao_etapa: true,
        status: true,
      },
    });
    const agendasPorVenda = new Map<
      number,
      Array<{
        subetapa?: string | null;
        execucao_etapa?: string | null;
        status?: string | null;
      }>
    >();
    for (const agenda of agendasObra) {
      const vendaId = Number((agenda as any).venda_id || 0);
      if (!vendaId) continue;
      const lista = agendasPorVenda.get(vendaId) || [];
      lista.push(agenda);
      agendasPorVenda.set(vendaId, lista);
    }
    const idsMatriz = Array.from(agendasPorVenda.entries())
      .filter(([, agendas]) =>
        classificarVendaPorFluxoMatrixOuLegado({ agendas }).obraVigente,
      )
      .map(([vendaId]) => vendaId);

    const funcionarioId =
      usuario?.funcionario_id != null && !usuario?.is_admin
        ? Number(usuario.funcionario_id)
        : null;
    const whereVenda: any = {
      OR: [
        {
          status: {
            in: Array.from(statusSet),
          },
        },
        ...(idsMatriz.length ? [{ id: { in: idsMatriz } }] : []),
      ],
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

  // =========================================================
  // ✅ FLUXO DE CAIXA — Entradas × Saídas + Meta de Vendas
  // =========================================================
  async getFluxoCaixa(mes: number, ano: number) {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const hoje = new Date();

    const statusPago = SF.PAGO;
    const statusAbertos = [SF.EM_ABERTO, SF.VENCIDO];

    // ── ENTRADAS REALIZADAS (recebimentos efetivos no mês) ──────────────
    const contasReceberPagas = await this.prisma.contas_receber.findMany({
      where: {
        status: statusPago,
        recebido_em: { gte: inicioMes, lte: fimMes },
      },
      select: {
        id: true,
        descricao: true,
        valor_original: true,
        valor_compensado: true,
        forma_recebimento_chave: true,
        origem_tipo: true,
        recebido_em: true,
        cliente: { select: { nome_completo: true, razao_social: true } },
      },
      orderBy: { recebido_em: 'desc' },
    });

    const entradasRealizadasItens = contasReceberPagas.map((c) => {
      const valor = Number((c as any).valor_compensado ?? 0) > 0
        ? Number((c as any).valor_compensado)
        : Number((c as any).valor_original ?? 0);
      return {
        id: c.id,
        descricao: (c as any).descricao || `Recebimento #${c.id}`,
        valor,
        forma: (c as any).forma_recebimento_chave || 'NÃO_INFORMADA',
        origem_tipo: (c as any).origem_tipo || null,
        data: (c as any).recebido_em,
        cliente:
          (c as any).cliente?.nome_completo ||
          (c as any).cliente?.razao_social ||
          null,
      };
    });

    const totalEntradasRealizadas = this.round2(
      entradasRealizadasItens.reduce((s, i) => s + i.valor, 0),
    );

    // Agrupamento por forma de recebimento
    const mapFormaEntrada = new Map<string, { forma: string; total: number; qtd: number }>();
    for (const item of entradasRealizadasItens) {
      const k = item.forma;
      const e = mapFormaEntrada.get(k) || { forma: k, total: 0, qtd: 0 };
      e.total = this.round2(e.total + item.valor);
      e.qtd += 1;
      mapFormaEntrada.set(k, e);
    }
    const entradasPorForma = [...mapFormaEntrada.values()].sort((a, b) => b.total - a.total);

    // ── ENTRADAS PENDENTES (contas a receber em aberto) ─────────────────
    const contasReceberAbertas = await this.prisma.contas_receber.findMany({
      where: { status: { in: statusAbertos } },
      select: {
        id: true,
        descricao: true,
        valor_original: true,
        status: true,
        vencimento_em: true,
        cliente: { select: { nome_completo: true, razao_social: true } },
      },
    });

    let totalEntradasPendentesVencidas = 0;
    let totalEntradasPendentesAVencer = 0;
    for (const c of contasReceberAbertas) {
      const v = Number((c as any).valor_original ?? 0);
      const venc = (c as any).vencimento_em ? new Date((c as any).vencimento_em) : null;
      if (venc && venc < hoje) totalEntradasPendentesVencidas = this.round2(totalEntradasPendentesVencidas + v);
      else totalEntradasPendentesAVencer = this.round2(totalEntradasPendentesAVencer + v);
    }
    const totalEntradasPendentes = this.round2(totalEntradasPendentesVencidas + totalEntradasPendentesAVencer);

    // ── SAÍDAS REALIZADAS (pagamentos efetivos no mês) ───────────────────
    // 1) contas_pagar pagas no mês
    const contasPagarPagas = await this.prisma.contas_pagar.findMany({
      where: {
        status: statusPago,
        pago_em: { gte: inicioMes, lte: fimMes },
      },
      select: {
        id: true,
        descricao: true,
        valor_original: true,
        valor_compensado: true,
        forma_pagamento_chave: true,
        origem_tipo: true,
        pago_em: true,
        fornecedor: { select: { nome_fantasia: true } },
        despesa: { select: { categoria: true, classificacao: true } },
      },
    });

    const saidasCP = contasPagarPagas.map((c) => {
      const v = Number((c as any).valor_compensado ?? 0) > 0
        ? Number((c as any).valor_compensado)
        : Number((c as any).valor_original ?? 0);
      return {
        id: c.id,
        descricao: (c as any).descricao || `Pagamento #${c.id}`,
        valor: v,
        forma: (c as any).forma_pagamento_chave || 'NÃO_INFORMADA',
        origem_tipo: (c as any).origem_tipo || 'CONTA_PAGAR',
        categoria: (c as any).despesa?.categoria || (c as any).origem_tipo || 'OUTROS',
        data: (c as any).pago_em,
        fornecedor: (c as any).fornecedor?.nome_fantasia || null,
      };
    });

    // 2) Despesas sem conta_pagar vinculada, pagas no mês (evita dupla contagem)
    const despesasPagas = await this.prisma.despesas.findMany({
      where: {
        status: statusPago,
        data_pagamento: { gte: inicioMes, lte: fimMes },
        conta_pagar: null,
      },
      select: {
        id: true,
        categoria: true,
        classificacao: true,
        valor_total: true,
        data_pagamento: true,
        forma_pagamento: true,
      },
    });

    const saidasDesp = despesasPagas.map((d) => ({
      id: d.id,
      descricao: `${(d as any).classificacao || (d as any).categoria || 'Despesa'} #${d.id}`,
      valor: Number((d as any).valor_total ?? 0),
      forma: (d as any).forma_pagamento || 'NÃO_INFORMADA',
      origem_tipo: 'DESPESA',
      categoria: (d as any).categoria || 'OUTROS',
      data: (d as any).data_pagamento,
      fornecedor: null as string | null,
    }));

    const todosSaidasRealizadas = [...saidasCP, ...saidasDesp];
    const totalSaidasRealizadas = this.round2(
      todosSaidasRealizadas.reduce((s, i) => s + i.valor, 0),
    );

    // Agrupamento por categoria de saída
    const mapCategoriaSaida = new Map<string, { categoria: string; total: number; qtd: number }>();
    for (const item of todosSaidasRealizadas) {
      const k = item.categoria;
      const e = mapCategoriaSaida.get(k) || { categoria: k, total: 0, qtd: 0 };
      e.total = this.round2(e.total + item.valor);
      e.qtd += 1;
      mapCategoriaSaida.set(k, e);
    }
    const saidasPorCategoria = [...mapCategoriaSaida.values()].sort((a, b) => b.total - a.total);

    // ── SAÍDAS PENDENTES (a pagar em aberto — sem filtro de mês para visão geral) ──
    const cpAberto = await this.prisma.contas_pagar.findMany({
      where: { status: { in: statusAbertos } },
      select: {
        id: true,
        descricao: true,
        valor_original: true,
        status: true,
        vencimento_em: true,
        origem_tipo: true,
        despesa: { select: { categoria: true } },
      },
    });

    const despAberto = await this.prisma.despesas.findMany({
      where: {
        status: { in: [SF.EM_ABERTO, SF.VENCIDO].filter(Boolean) as string[] },
        conta_pagar: null,
      },
      select: {
        id: true,
        valor_total: true,
        status: true,
        data_vencimento: true,
        categoria: true,
      },
    });

    let totalSaidasPendentesVencidas = 0;
    let totalSaidasPendentesAVencer = 0;
    const mapCategoriaPendente = new Map<string, { categoria: string; total: number; qtd: number }>();

    const acumularPendente = (v: number, venc: Date | null, cat: string) => {
      if (venc && venc < hoje) totalSaidasPendentesVencidas = this.round2(totalSaidasPendentesVencidas + v);
      else totalSaidasPendentesAVencer = this.round2(totalSaidasPendentesAVencer + v);
      const e = mapCategoriaPendente.get(cat) || { categoria: cat, total: 0, qtd: 0 };
      e.total = this.round2(e.total + v);
      e.qtd += 1;
      mapCategoriaPendente.set(cat, e);
    };

    for (const c of cpAberto) {
      const v = Number((c as any).valor_original ?? 0);
      const venc = (c as any).vencimento_em ? new Date((c as any).vencimento_em) : null;
      const cat = (c as any).despesa?.categoria || (c as any).origem_tipo || 'OUTROS';
      acumularPendente(v, venc, cat);
    }
    for (const d of despAberto) {
      const v = Number((d as any).valor_total ?? 0);
      const venc = (d as any).data_vencimento ? new Date((d as any).data_vencimento) : null;
      acumularPendente(v, venc, (d as any).categoria || 'OUTROS');
    }

    const totalSaidasPendentes = this.round2(totalSaidasPendentesVencidas + totalSaidasPendentesAVencer);
    const saidasPendentesPorCategoria = [...mapCategoriaPendente.values()].sort((a, b) => b.total - a.total);

    // ── TOTAIS E META ───────────────────────────────────────────────────
    const totalEntradas = this.round2(totalEntradasRealizadas + totalEntradasPendentes);
    const totalSaidas = this.round2(totalSaidasRealizadas + totalSaidasPendentes);

    const saldoRealizado = this.round2(totalEntradasRealizadas - totalSaidasRealizadas);
    const saldoProjetado = this.round2(totalEntradas - totalSaidas);

    // "Quanto preciso vender": déficit considerando apenas o que já está comprometido
    const totalComprometido = this.round2(totalSaidasRealizadas + totalSaidasPendentes);
    const totalCoberto = this.round2(totalEntradasRealizadas + totalEntradasPendentes);
    const deficitBruto = this.round2(Math.max(0, totalComprometido - totalCoberto));

    // Margem bruta estimada: CPV/Receita do próprio mês (ou ~40% como baseline)
    let margemBrutaPct = 0.40; // baseline conservador
    if (totalEntradasRealizadas > 0) {
      const cpvMesCP = saidasCP
        .filter((s) => ['INSUMO', 'MATERIA_PRIMA', 'MATERIA PRIMA', 'INSUMOS', 'COMPRA'].some(
          (c) => s.categoria.toUpperCase().includes(c),
        ))
        .reduce((s, i) => s + i.valor, 0);
      const cpvMesDesp = saidasDesp
        .filter((s) => ['INSUMO', 'MATERIA_PRIMA', 'MATERIA PRIMA', 'INSUMOS'].some(
          (c) => s.categoria.toUpperCase().includes(c),
        ))
        .reduce((s, i) => s + i.valor, 0);
      const cpvMes = cpvMesCP + cpvMesDesp;
      if (cpvMes > 0 && totalEntradasRealizadas > 0) {
        margemBrutaPct = Math.max(0.05, Math.min(0.95, 1 - (cpvMes / totalEntradasRealizadas)));
      }
    }

    // Para cobrir o déficit em termos de receita bruta (considerando que parte da receita vai para CPV)
    const vendasNecessariasComMargem = deficitBruto > 0
      ? this.round2(deficitBruto / margemBrutaPct)
      : 0;

    return {
      mes,
      ano,
      periodo: {
        inicio: inicioMes.toISOString().split('T')[0],
        fim: fimMes.toISOString().split('T')[0],
      },
      entradas: {
        realizadas: {
          total: totalEntradasRealizadas,
          por_forma: entradasPorForma,
          itens: entradasRealizadasItens.slice(0, 100),
        },
        pendentes: {
          total: totalEntradasPendentes,
          vencido: totalEntradasPendentesVencidas,
          a_vencer: totalEntradasPendentesAVencer,
        },
        total: totalEntradas,
      },
      saidas: {
        realizadas: {
          total: totalSaidasRealizadas,
          contas_pagar: this.round2(saidasCP.reduce((s, i) => s + i.valor, 0)),
          despesas_avulsas: this.round2(saidasDesp.reduce((s, i) => s + i.valor, 0)),
          por_categoria: saidasPorCategoria,
          itens: todosSaidasRealizadas
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 100),
        },
        pendentes: {
          total: totalSaidasPendentes,
          vencido: totalSaidasPendentesVencidas,
          a_vencer: totalSaidasPendentesAVencer,
          por_categoria: saidasPendentesPorCategoria,
        },
        total: totalSaidas,
      },
      saldo: {
        realizado: saldoRealizado,
        projetado: saldoProjetado,
      },
      meta_vendas: {
        total_comprometido: totalComprometido,
        total_coberto: totalCoberto,
        deficit_bruto: deficitBruto,
        margem_bruta_pct: this.round2(margemBrutaPct * 100),
        vendas_necessarias: vendasNecessariasComMargem,
        situacao: deficitBruto === 0 ? 'COBERTO' : 'DEFICIT',
      },
    };
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

    const resumoRotas = await this.rotaCustoViagem.getResumoCustos({
      data_inicio: inicioMes.toISOString(),
      data_fim: fimMes.toISOString().slice(0, 10),
    });
    const custoVeiculos = this.round2(Number(resumoRotas.custo_total ?? 0));

    const cpvTotal = this.round2(cpvMateriais + custoVeiculos);
    const receita = this.round2(receitaBruta);
    const margemContribuicao = this.round2(receita - impostos - cpvTotal);
    const lucroLiquido = this.round2(margemContribuicao - despesasFixasTotal);

    return {
      mes,
      ano,
      receitaBruta: receita,
      impostos: this.round2(impostos),
      cpvMateriais: this.round2(cpvMateriais),
      custoVeiculos,
      cpvTotal,
      despesasFixasSalarios,
      despesasFixasOutras,
      despesasFixasTotal,
      absorcaoProjetos,
      margemContribuicao,
      lucroLiquido,
    };
  }

  // =========================================================
  // ✅ RELATÓRIO CONTAS A PAGAR — dados agregados para aba Relatório
  // =========================================================
  async gerarRelatorioContasPagar(filtros: {
    mes?: number;
    ano?: number;
    fornecedor_id?: number;
    forma_pagamento?: string;
    status?: string;
  }) {
    const mes = filtros.mes ?? new Date().getMonth() + 1;
    const ano = filtros.ano ?? new Date().getFullYear();

    // Reutiliza o consolidado existente com os mesmos filtros
    const consolidado = await this.listarContasPagarConsolidado({
      mes,
      ano,
      fornecedor_id: filtros.fornecedor_id,
    });

    // Aplica filtros adicionais (forma de pagamento, status)
    let dados = consolidado;
    if (filtros.forma_pagamento) {
      const fp = filtros.forma_pagamento.toUpperCase();
      dados = dados.filter(
        (r) => String(r.forma_pagamento_chave || '').toUpperCase() === fp,
      );
    }
    if (filtros.status) {
      const st = filtros.status.toUpperCase();
      dados = dados.filter(
        (r) => String(r.status || '').toUpperCase() === st,
      );
    }

    // ---------- Totalizadores ----------
    const totalGeral = this.round2(
      dados.reduce((s, r) => s + Number(r.valor ?? 0), 0),
    );

    // Por fornecedor
    const mapFornecedor = new Map<string, { nome: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.fornecedor_nome || 'Sem fornecedor';
      const item = mapFornecedor.get(key) || { nome: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + Number(r.valor ?? 0));
      item.qtd += 1;
      mapFornecedor.set(key, item);
    }
    const porFornecedor = [...mapFornecedor.values()]
      .sort((a, b) => b.total - a.total);

    // Por forma de pagamento
    const mapForma = new Map<string, { forma: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.forma_pagamento_chave || 'NÃO DEFINIDA';
      const item = mapForma.get(key) || { forma: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + Number(r.valor ?? 0));
      item.qtd += 1;
      mapForma.set(key, item);
    }
    const porFormaPagamento = [...mapForma.values()]
      .sort((a, b) => b.total - a.total);

    // Por status
    const mapStatus = new Map<string, { status: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.status || 'INDEFINIDO';
      const item = mapStatus.get(key) || { status: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + Number(r.valor ?? 0));
      item.qtd += 1;
      mapStatus.set(key, item);
    }
    const porStatus = [...mapStatus.values()]
      .sort((a, b) => b.total - a.total);

    // Por natureza/origem
    const mapOrigem = new Map<string, { origem: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.origem || 'OUTROS';
      const item = mapOrigem.get(key) || { origem: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + Number(r.valor ?? 0));
      item.qtd += 1;
      mapOrigem.set(key, item);
    }
    const porOrigem = [...mapOrigem.values()]
      .sort((a, b) => b.total - a.total);

    return {
      mes,
      ano,
      totalGeral,
      totalLancamentos: dados.length,
      porFornecedor,
      porFormaPagamento,
      porStatus,
      porOrigem,
      lancamentos: dados,
    };
  }

  // =========================================================
  // ✅ RELATÓRIO CONTAS A PAGAR — PDF
  // =========================================================
  async gerarRelatorioContasPagarPdf(filtros: {
    mes?: number;
    ano?: number;
    fornecedor_id?: number;
    forma_pagamento?: string;
    status?: string;
  }): Promise<Buffer> {
    const relatorio = await this.gerarRelatorioContasPagar(filtros);
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const mesStr = String(relatorio.mes).padStart(2, '0');
        const anoStr = String(relatorio.ano);
        const formatMoeda = (v: number) =>
          v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // ===== CABEÇALHO =====
        doc
          .fillColor('#19263a')
          .fontSize(16)
          .text('Relatório de Contas a Pagar', { align: 'center' });
        doc
          .fontSize(10)
          .fillColor('#475569')
          .text(`Competência: ${mesStr}/${anoStr}`, { align: 'center' });
        doc.moveDown(0.5);
        doc
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.moveDown(1);

        // ===== RESUMO GERAL =====
        doc
          .fillColor('#19263a')
          .fontSize(12)
          .text('Resumo Geral');
        doc.moveDown(0.3);
        doc
          .fontSize(9)
          .fillColor('#334155')
          .text(`Total geral: ${formatMoeda(relatorio.totalGeral)}`)
          .text(`Total de lançamentos: ${relatorio.totalLancamentos}`);
        doc.moveDown(0.8);

        // ===== POR NATUREZA =====
        doc
          .fillColor('#19263a')
          .fontSize(11)
          .text('Por Natureza');
        doc.moveDown(0.3);

        const origemLabels: Record<string, string> = {
          COMPRA: 'Compra',
          FECHAMENTO: 'Fechamento',
          TITULO_FECHAMENTO: 'Parcela',
          DESPESA: 'Despesa geral',
          PLANO_CORTE: 'Serviço de Corte',
        };

        for (const item of relatorio.porOrigem) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(
              `  ${origemLabels[item.origem] || item.origem}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`,
            );
        }
        doc.moveDown(0.8);

        // ===== POR STATUS =====
        doc
          .fillColor('#19263a')
          .fontSize(11)
          .text('Por Status');
        doc.moveDown(0.3);

        for (const item of relatorio.porStatus) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(
              `  ${item.status}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`,
            );
        }
        doc.moveDown(0.8);

        // ===== POR FORMA DE PAGAMENTO =====
        doc
          .fillColor('#19263a')
          .fontSize(11)
          .text('Por Forma de Pagamento');
        doc.moveDown(0.3);

        for (const item of relatorio.porFormaPagamento) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(
              `  ${item.forma}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`,
            );
        }
        doc.moveDown(0.8);

        // ===== POR FORNECEDOR =====
        doc
          .fillColor('#19263a')
          .fontSize(11)
          .text('Por Fornecedor');
        doc.moveDown(0.3);

        for (const item of relatorio.porFornecedor) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(
              `  ${item.nome}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`,
            );
        }
        doc.moveDown(1);

        // ===== TABELA DE LANÇAMENTOS =====
        doc
          .fillColor('#19263a')
          .fontSize(11)
          .text('Detalhamento dos Lançamentos');
        doc.moveDown(0.4);

        // Cabeçalho da tabela
        const colX = [40, 110, 210, 340, 430, 510];
        const headerY = doc.y;
        doc.fontSize(7).fillColor('#64748b');
        doc.text('Natureza', colX[0], headerY);
        doc.text('Vencimento', colX[1], headerY);
        doc.text('Fornecedor/Titular', colX[2], headerY);
        doc.text('Forma', colX[3], headerY);
        doc.text('Status', colX[4], headerY);
        doc.text('Valor', colX[5], headerY, { align: 'right', width: 50 });
        doc.moveDown(0.3);

        // Linha separadora
        doc
          .strokeColor('#d6e0ea')
          .lineWidth(0.5)
          .moveTo(40, doc.y)
          .lineTo(560, doc.y)
          .stroke();
        doc.moveDown(0.15);

        // Linhas da tabela
        const pageBottom = 780;
        for (const r of relatorio.lancamentos) {
          if (doc.y > pageBottom) {
            doc.addPage();
          }

          const y = doc.y;
          doc.fontSize(7).fillColor('#334155');
          doc.text(origemLabels[(r as any).origem] || (r as any).origem || '—', colX[0], y, { width: 65 });
          doc.text(
            r.vencimento_em
              ? new Date(r.vencimento_em).toLocaleDateString('pt-BR')
              : '—',
            colX[1],
            y,
            { width: 90 },
          );
          doc.text(
            (r as any).fornecedor_nome || (r as any).funcionario_nome || 'Despesa geral',
            colX[2],
            y,
            { width: 125 },
          );
          doc.text(
            (r as any).forma_pagamento_chave || '—',
            colX[3],
            y,
            { width: 85 },
          );
          doc.text(r.status || '—', colX[4], y, { width: 75 });
          doc.text(formatMoeda(Number(r.valor ?? 0)), colX[5], y, {
            align: 'right',
            width: 50,
          });
          doc.moveDown(0.6);
        }

        // ===== RODAPÉ =====
        doc.moveDown(0.5);
        doc
          .strokeColor('#d6e0ea')
          .lineWidth(0.5)
          .moveTo(40, doc.y)
          .lineTo(560, doc.y)
          .stroke();
        doc.moveDown(0.3);
        doc
          .fontSize(9)
          .fillColor('#19263a')
          .text(`Total: ${formatMoeda(relatorio.totalGeral)}`, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // =========================================================
  // ✅ RELATÓRIO CONTAS A RECEBER — dados agregados
  // =========================================================
  async gerarRelatorioContasReceber(filtros: {
    mes?: number;
    ano?: number;
    cliente_id?: number;
    forma_recebimento?: string;
    status?: string;
  }) {
    const mes = filtros.mes ?? new Date().getMonth() + 1;
    const ano = filtros.ano ?? new Date().getFullYear();

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const whereBase: any = {};
    if (filtros.cliente_id) whereBase.cliente_id = filtros.cliente_id;
    if (filtros.status) whereBase.status = filtros.status.toUpperCase();
    if (filtros.forma_recebimento)
      whereBase.forma_recebimento_chave = filtros.forma_recebimento.toUpperCase();

    const contas = await this.prisma.contas_receber.findMany({
      where: {
        ...whereBase,
        origem_tipo: { not: 'IMPORTACAO_LEITURA' },
        OR: [
          { vencimento_em: { gte: inicioMes, lte: fimMes } },
          {
            vencimento_em: { lt: inicioMes },
            status: { notIn: ['PAGO', 'RECEBIDO', 'CANCELADO'] },
          },
        ],
      },
      include: {
        cliente: { select: { nome_completo: true, razao_social: true } },
        fornecedor: { select: { nome_fantasia: true, razao_social: true } },
      },
      orderBy: [{ vencimento_em: 'asc' }, { id: 'desc' }],
    });

    const dadosContas = contas.map((c: any) => ({
      ...c,
      valor: Number(c.valor_original ?? 0),
      cliente_nome:
        c.cliente?.nome_completo ||
        c.cliente?.razao_social ||
        c.fornecedor?.nome_fantasia ||
        c.fornecedor?.razao_social ||
        'Não identificado',
      origem: c.origem_tipo || 'OUTROS',
    }));

    // ---- Planos de corte (receita de serviço de corte) ----
    const whereCorte: any = {
      data_venda: { gte: inicioMes, lte: fimMes },
    };
    if (filtros.status) whereCorte.status = filtros.status.toUpperCase();

    const planos = await this.prisma.plano_corte.findMany({
      where: whereCorte,
      include: {
        fornecedor: { select: { nome_fantasia: true, razao_social: true } },
      },
      orderBy: [{ data_venda: 'asc' }, { id: 'desc' }],
    });

    const dadosCorte = planos.map((p: any) => ({
      id: p.id,
      valor: Number(p.valor_total ?? 0),
      cliente_nome:
        p.fornecedor?.nome_fantasia ||
        p.fornecedor?.razao_social ||
        'Sem fornecedor',
      origem: 'SERVICO_CORTE',
      status: p.status,
      vencimento_em: p.data_venda,
      forma_recebimento_chave: null,
      _tipo: 'corte',
    }));

    const dados = [...dadosContas, ...dadosCorte];

    // ---------- Totalizadores ----------
    const totalGeral = this.round2(
      dados.reduce((s, r) => s + r.valor, 0),
    );

    // Por cliente
    const mapCliente = new Map<string, { nome: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.cliente_nome;
      const item = mapCliente.get(key) || { nome: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + r.valor);
      item.qtd += 1;
      mapCliente.set(key, item);
    }
    const porCliente = [...mapCliente.values()].sort((a, b) => b.total - a.total);

    // Por forma de recebimento
    const mapForma = new Map<string, { forma: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.forma_recebimento_chave || 'NÃO DEFINIDA';
      const item = mapForma.get(key) || { forma: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + r.valor);
      item.qtd += 1;
      mapForma.set(key, item);
    }
    const porFormaRecebimento = [...mapForma.values()].sort((a, b) => b.total - a.total);

    // Por status
    const mapStatus = new Map<string, { status: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.status || 'INDEFINIDO';
      const item = mapStatus.get(key) || { status: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + r.valor);
      item.qtd += 1;
      mapStatus.set(key, item);
    }
    const porStatus = [...mapStatus.values()].sort((a, b) => b.total - a.total);

    // Por origem
    const mapOrigem = new Map<string, { origem: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.origem;
      const item = mapOrigem.get(key) || { origem: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + r.valor);
      item.qtd += 1;
      mapOrigem.set(key, item);
    }
    const porOrigem = [...mapOrigem.values()].sort((a, b) => b.total - a.total);

    return {
      mes,
      ano,
      totalGeral,
      totalLancamentos: dados.length,
      porCliente,
      porFormaRecebimento,
      porStatus,
      porOrigem,
      lancamentos: dados,
    };
  }

  // =========================================================
  // ✅ RELATÓRIO CONTAS A RECEBER — PDF
  // =========================================================
  async gerarRelatorioContasReceberPdf(filtros: {
    mes?: number;
    ano?: number;
    cliente_id?: number;
    forma_recebimento?: string;
    status?: string;
  }): Promise<Buffer> {
    const relatorio = await this.gerarRelatorioContasReceber(filtros);
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const mesStr = String(relatorio.mes).padStart(2, '0');
        const anoStr = String(relatorio.ano);
        const formatMoeda = (v: number) =>
          v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const origemLabels: Record<string, string> = {
          VENDA: 'Venda',
          POS_VENDA: 'Pós-venda',
          IMPORTACAO_LEITURA: 'Importação/Leitura',
          SERVICO_CORTE: 'Serviço de Corte',
        };

        // ===== CABEÇALHO =====
        doc
          .fillColor('#19263a')
          .fontSize(16)
          .text('Relatório de Contas a Receber', { align: 'center' });
        doc
          .fontSize(10)
          .fillColor('#475569')
          .text(`Competência: ${mesStr}/${anoStr}`, { align: 'center' });
        doc.moveDown(0.5);
        doc
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.moveDown(1);

        // ===== RESUMO GERAL =====
        doc.fillColor('#19263a').fontSize(12).text('Resumo Geral');
        doc.moveDown(0.3);
        doc
          .fontSize(9)
          .fillColor('#334155')
          .text(`Total geral: ${formatMoeda(relatorio.totalGeral)}`)
          .text(`Total de lançamentos: ${relatorio.totalLancamentos}`);
        doc.moveDown(0.8);

        // ===== POR ORIGEM =====
        doc.fillColor('#19263a').fontSize(11).text('Por Origem');
        doc.moveDown(0.3);
        for (const item of relatorio.porOrigem) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(`  ${origemLabels[item.origem] || item.origem}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`);
        }
        doc.moveDown(0.8);

        // ===== POR STATUS =====
        doc.fillColor('#19263a').fontSize(11).text('Por Status');
        doc.moveDown(0.3);
        for (const item of relatorio.porStatus) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(`  ${item.status}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`);
        }
        doc.moveDown(0.8);

        // ===== POR FORMA DE RECEBIMENTO =====
        doc.fillColor('#19263a').fontSize(11).text('Por Forma de Recebimento');
        doc.moveDown(0.3);
        for (const item of relatorio.porFormaRecebimento) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(`  ${item.forma}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`);
        }
        doc.moveDown(0.8);

        // ===== POR CLIENTE =====
        doc.fillColor('#19263a').fontSize(11).text('Por Cliente');
        doc.moveDown(0.3);
        for (const item of relatorio.porCliente) {
          doc
            .fontSize(8)
            .fillColor('#475569')
            .text(`  ${item.nome}: ${formatMoeda(item.total)} (${item.qtd} lançamentos)`);
        }
        doc.moveDown(1);

        // ===== TABELA DE LANÇAMENTOS =====
        doc.fillColor('#19263a').fontSize(11).text('Detalhamento dos Lançamentos');
        doc.moveDown(0.4);

        const colX = [40, 110, 210, 340, 430, 510];
        const headerY = doc.y;
        doc.fontSize(7).fillColor('#64748b');
        doc.text('Origem', colX[0], headerY);
        doc.text('Vencimento', colX[1], headerY);
        doc.text('Cliente / Titular', colX[2], headerY);
        doc.text('Forma', colX[3], headerY);
        doc.text('Status', colX[4], headerY);
        doc.text('Valor', colX[5], headerY, { align: 'right', width: 50 });
        doc.moveDown(0.3);

        doc.strokeColor('#d6e0ea').lineWidth(0.5).moveTo(40, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.15);

        const pageBottom = 780;
        for (const r of relatorio.lancamentos) {
          if (doc.y > pageBottom) doc.addPage();
          const y = doc.y;
          doc.fontSize(7).fillColor('#334155');
          doc.text(origemLabels[(r as any).origem] || (r as any).origem || '—', colX[0], y, { width: 65 });
          doc.text(r.vencimento_em ? new Date(r.vencimento_em).toLocaleDateString('pt-BR') : '—', colX[1], y, { width: 90 });
          doc.text((r as any).cliente_nome || 'Não identificado', colX[2], y, { width: 125 });
          doc.text((r as any).forma_recebimento_chave || '—', colX[3], y, { width: 85 });
          doc.text(r.status || '—', colX[4], y, { width: 75 });
          doc.text(formatMoeda(Number(r.valor ?? 0)), colX[5], y, { align: 'right', width: 50 });
          doc.moveDown(0.6);
        }

        doc.moveDown(0.5);
        doc.strokeColor('#d6e0ea').lineWidth(0.5).moveTo(40, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#19263a').text(`Total: ${formatMoeda(relatorio.totalGeral)}`, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // =========================================================
  // ✅ RELATÓRIO SERVIÇO DE CORTE — dados agregados
  // =========================================================
  async gerarRelatorioServicosCorte(filtros: {
    mes?: number;
    ano?: number;
    fornecedor_id?: number;
    status?: string;
  }) {
    const mes = filtros.mes ?? new Date().getMonth() + 1;
    const ano = filtros.ano ?? new Date().getFullYear();

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);

    const whereBase: any = {
      data_venda: { gte: inicioMes, lte: fimMes },
    };
    if (filtros.fornecedor_id) whereBase.fornecedor_id = filtros.fornecedor_id;
    if (filtros.status) whereBase.status = filtros.status.toUpperCase();

    const planos = await this.prisma.plano_corte.findMany({
      where: whereBase,
      include: {
        fornecedor: { select: { nome_fantasia: true, razao_social: true } },
        produtos: {
          select: { quantidade: true, valor_unitario: true, valor_total: true },
        },
      },
      orderBy: [{ data_venda: 'asc' }, { id: 'desc' }],
    });

    const dados = planos.map((p: any) => ({
      id: p.id,
      fornecedor_id: p.fornecedor_id,
      fornecedor_nome:
        p.fornecedor?.nome_fantasia ||
        p.fornecedor?.razao_social ||
        'Sem fornecedor',
      data_venda: p.data_venda,
      valor_total: Number(p.valor_total ?? 0),
      status: p.status,
      qtd_produtos: p.produtos?.length ?? 0,
    }));

    const totalGeral = this.round2(
      dados.reduce((s, r) => s + r.valor_total, 0),
    );

    // Por fornecedor
    const mapFornecedor = new Map<string, { nome: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.fornecedor_nome;
      const item = mapFornecedor.get(key) || { nome: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + r.valor_total);
      item.qtd += 1;
      mapFornecedor.set(key, item);
    }
    const porFornecedor = [...mapFornecedor.values()].sort((a, b) => b.total - a.total);

    // Por status
    const mapStatus = new Map<string, { status: string; total: number; qtd: number }>();
    for (const r of dados) {
      const key = r.status || 'INDEFINIDO';
      const item = mapStatus.get(key) || { status: key, total: 0, qtd: 0 };
      item.total = this.round2(item.total + r.valor_total);
      item.qtd += 1;
      mapStatus.set(key, item);
    }
    const porStatus = [...mapStatus.values()].sort((a, b) => b.total - a.total);

    return {
      mes,
      ano,
      totalGeral,
      totalLancamentos: dados.length,
      porFornecedor,
      porStatus,
      lancamentos: dados,
    };
  }

  // =========================================================
  // ✅ RELATÓRIO SERVIÇO DE CORTE — PDF
  // =========================================================
  async gerarRelatorioServicosCortePdf(filtros: {
    mes?: number;
    ano?: number;
    fornecedor_id?: number;
    status?: string;
  }): Promise<Buffer> {
    const relatorio = await this.gerarRelatorioServicosCorte(filtros);
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const mesStr = String(relatorio.mes).padStart(2, '0');
        const anoStr = String(relatorio.ano);
        const formatMoeda = (v: number) =>
          v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // ===== CABEÇALHO =====
        doc.fillColor('#19263a').fontSize(16).text('Relatório de Serviço de Corte', { align: 'center' });
        doc.fontSize(10).fillColor('#475569').text(`Competência: ${mesStr}/${anoStr}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(8).fillColor('#94a3b8').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.moveDown(1);

        // ===== RESUMO GERAL =====
        doc.fillColor('#19263a').fontSize(12).text('Resumo Geral');
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#334155')
          .text(`Total geral: ${formatMoeda(relatorio.totalGeral)}`)
          .text(`Total de planos: ${relatorio.totalLancamentos}`);
        doc.moveDown(0.8);

        // ===== POR STATUS =====
        doc.fillColor('#19263a').fontSize(11).text('Por Status');
        doc.moveDown(0.3);
        for (const item of relatorio.porStatus) {
          doc.fontSize(8).fillColor('#475569')
            .text(`  ${item.status}: ${formatMoeda(item.total)} (${item.qtd} planos)`);
        }
        doc.moveDown(0.8);

        // ===== POR FORNECEDOR =====
        doc.fillColor('#19263a').fontSize(11).text('Por Fornecedor');
        doc.moveDown(0.3);
        for (const item of relatorio.porFornecedor) {
          doc.fontSize(8).fillColor('#475569')
            .text(`  ${item.nome}: ${formatMoeda(item.total)} (${item.qtd} planos)`);
        }
        doc.moveDown(1);

        // ===== TABELA =====
        doc.fillColor('#19263a').fontSize(11).text('Detalhamento dos Planos');
        doc.moveDown(0.4);

        const colX = [40, 80, 180, 340, 440, 510];
        const headerY = doc.y;
        doc.fontSize(7).fillColor('#64748b');
        doc.text('#', colX[0], headerY);
        doc.text('Data Venda', colX[1], headerY);
        doc.text('Fornecedor', colX[2], headerY);
        doc.text('Status', colX[3], headerY);
        doc.text('Itens', colX[4], headerY);
        doc.text('Valor', colX[5], headerY, { align: 'right', width: 50 });
        doc.moveDown(0.3);

        doc.strokeColor('#d6e0ea').lineWidth(0.5).moveTo(40, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.15);

        const pageBottom = 780;
        for (const r of relatorio.lancamentos) {
          if (doc.y > pageBottom) doc.addPage();
          const y = doc.y;
          doc.fontSize(7).fillColor('#334155');
          doc.text(String(r.id), colX[0], y, { width: 35 });
          doc.text(r.data_venda ? new Date(r.data_venda).toLocaleDateString('pt-BR') : '—', colX[1], y, { width: 95 });
          doc.text(r.fornecedor_nome, colX[2], y, { width: 155 });
          doc.text(r.status || '—', colX[3], y, { width: 95 });
          doc.text(String(r.qtd_produtos), colX[4], y, { width: 65 });
          doc.text(formatMoeda(r.valor_total), colX[5], y, { align: 'right', width: 50 });
          doc.moveDown(0.6);
        }

        doc.moveDown(0.5);
        doc.strokeColor('#d6e0ea').lineWidth(0.5).moveTo(40, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#19263a').text(`Total: ${formatMoeda(relatorio.totalGeral)}`, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
