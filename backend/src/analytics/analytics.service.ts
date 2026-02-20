import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** KPIs: total a pagar, a receber, clientes ativos */
  async getDashboardResumo(): Promise<{
    total_a_pagar: number;
    total_a_receber: number;
    clientes_ativos: number;
  }> {
    const [somaPagar, somaReceber, clientesAtivos] = await Promise.all([
      this.prisma.contas_pagar.aggregate({
        where: { pago_em: null },
        _sum: { valor_original: true },
      }),
      this.prisma.contas_receber.aggregate({
        where: { recebido_em: null },
        _sum: { valor_original: true },
      }),
      this.prisma.cliente.count({ where: { status: 'ATIVO' } }),
    ]);

    const total_a_pagar = Number(somaPagar._sum.valor_original ?? 0);
    const total_a_receber = Number(somaReceber._sum.valor_original ?? 0);

    return {
      total_a_pagar: Math.round(total_a_pagar * 100) / 100,
      total_a_receber: Math.round(total_a_receber * 100) / 100,
      clientes_ativos: clientesAtivos,
    };
  }

  /** Status de projetos (equivalente ao antigo status-obras; tabela obras foi removida) */
  async getStatusProjetos(): Promise<{ status: string; total: number }[]> {
    const rows = await this.prisma.projetos.groupBy({
      by: ['status_atual'],
      _count: { id: true },
      orderBy: { status_atual: 'asc' },
    });
    return rows.map((r) => ({
      status: r.status_atual || 'N/A',
      total: r._count.id,
    }));
  }

  /** Resumo para a visão geral Vendas (Comercial): orçamentos, vendas fechadas no mês, contratos. */
  async getResumoVendas(): Promise<{
    orcamentos_em_andamento: number;
    orcamentos_aprovados_sem_venda: number;
    vendas_fechadas_mes: number;
    contratos_total: number;
  }> {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const [orcamentosTotal, orcamentosComVenda, vendasMes, contratosTotal] = await Promise.all([
      this.prisma.orcamentos.count(),
      this.prisma.orcamentos.count({ where: { venda: { isNot: null } } }),
      this.prisma.vendas.count({
        where: { data_venda: { gte: inicioMes, lte: fimMes } },
      }),
      this.prisma.contratos.count(),
    ]);

    const orcamentosSemVenda = Math.max(0, orcamentosTotal - orcamentosComVenda);
    return {
      orcamentos_em_andamento: orcamentosTotal,
      orcamentos_aprovados_sem_venda: orcamentosSemVenda,
      vendas_fechadas_mes: vendasMes,
      contratos_total: contratosTotal,
    };
  }

  /** Resumo para a visão geral Produção: vendas por etapa, plano de corte. */
  async getResumoProducao(): Promise<{
    vendas_total: number;
    vendas_em_producao: number;
    vendas_finalizadas: number;
    plano_corte_total: number;
  }> {
    const vendas = await this.prisma.vendas.findMany({
      select: { id: true, status: true },
    });
    const statusProducao = ['PRODUCAO_AGENDADA', 'EM_PRODUCAO', 'PRODUCAO_FINALIZADA'];
    const statusFinalizadas = ['MONTAGEM_FINALIZADA', 'ENCERRADO'];
    const normalize = (s: string) => String(s || '').trim().toUpperCase().replace(/\s+/g, '_');
    let emProducao = 0;
    let finalizadas = 0;
    for (const v of vendas) {
      const key = normalize(v.status);
      if (statusProducao.some((x) => key.includes(x) || key === 'EM_PRODUCAO')) emProducao += 1;
      if (statusFinalizadas.some((x) => key === x)) finalizadas += 1;
    }
    const planoTotal = await this.prisma.plano_corte.count();
    return {
      vendas_total: vendas.length,
      vendas_em_producao: emProducao,
      vendas_finalizadas: finalizadas,
      plano_corte_total: planoTotal,
    };
  }

  /** Despesas (SAÍDA) por mês e categoria. Filtros: inicio, fim (YYYY-MM-DD). */
  async getDreDespesas(inicio?: string, fim?: string): Promise<{ mes: string; categoria: string; total: number }[]> {
    const hoje = new Date();
    const dtInicio = inicio ? new Date(inicio) : new Date(hoje.getFullYear(), 0, 1);
    const dtFim = fim ? new Date(fim) : hoje;

    // 1) Títulos financeiros vinculados a despesas SAÍDA
    const titulos = await this.prisma.titulos_financeiros.findMany({
      where: {
        despesa_id: { not: null },
        vencimento_em: { gte: dtInicio, lte: dtFim },
        despesa: { tipo_movimento: 'SAIDA' },
      },
      select: {
        vencimento_em: true,
        valor: true,
        despesa: { select: { categoria: true } },
      },
    });

    // 2) Despesas SAÍDA sem títulos (data_vencimento no período)
    const despesasSemTitulo = await this.prisma.despesas.findMany({
      where: {
        tipo_movimento: 'SAIDA',
        data_vencimento: { gte: dtInicio, lte: dtFim },
        titulos: { none: {} },
      },
      select: { categoria: true, data_vencimento: true, valor_total: true },
    });

    type Item = { mes: string; categoria: string; valor: number };
    const itens: Item[] = [];

    for (const t of titulos) {
      if (!t.despesa) continue;
      const data = t.vencimento_em;
      const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      itens.push({
        mes,
        categoria: (t.despesa.categoria || '').toUpperCase(),
        valor: Number(t.valor),
      });
    }
    for (const d of despesasSemTitulo) {
      const data = d.data_vencimento;
      const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      itens.push({
        mes,
        categoria: (d.categoria || '').toUpperCase(),
        valor: Number(d.valor_total),
      });
    }

    // Agrupar por mes + categoria
    const map = new Map<string, number>();
    for (const { mes, categoria, valor } of itens) {
      const key = `${mes}|${categoria}`;
      map.set(key, (map.get(key) ?? 0) + valor);
    }

    const result = Array.from(map.entries()).map(([key, total]) => {
      const [mes, categoria] = key.split('|');
      return { mes, categoria, total: Math.round(total * 100) / 100 };
    });
    result.sort((a, b) => (a.mes + a.categoria).localeCompare(b.mes + b.categoria));
    return result;
  }

  /**
   * DRE mensal (Demonstração do Resultado do Exercício) por competência.
   * Receita = vendas (data_venda no mês). Despesas = despesas SAÍDA com vencimento no mês.
   */
  async getDreMensal(
    mes: number,
    ano: number,
  ): Promise<{
    mes: number;
    ano: number;
    receita_total: number;
    despesas_total: number;
    despesas_por_categoria: { categoria: string; total: number }[];
    resultado: number;
  }> {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;

    // Receita: vendas com data_venda no mês (valor_total)
    const vendasMes = await this.prisma.vendas.aggregate({
      where: {
        data_venda: { gte: inicioMes, lte: fimMes },
      },
      _sum: { valor_total: true },
    });
    const receita_total = Math.round(Number(vendasMes._sum.valor_total ?? 0) * 100) / 100;

    // Despesas: mesmo critério de getDreDespesas, filtrado ao mês
    const dreDespesas = await this.getDreDespesas(
      `${ano}-${String(mes).padStart(2, '0')}-01`,
      `${ano}-${String(mes).padStart(2, '0')}-31`,
    );
    const despesasPorCategoria = new Map<string, number>();
    let despesas_total = 0;
    for (const d of dreDespesas) {
      if (d.mes !== mesStr) continue;
      despesas_total += d.total;
      despesasPorCategoria.set(d.categoria, (despesasPorCategoria.get(d.categoria) ?? 0) + d.total);
    }
    despesas_total = Math.round(despesas_total * 100) / 100;

    const despesas_por_categoria = Array.from(despesasPorCategoria.entries()).map(([categoria, total]) => ({
      categoria,
      total: Math.round(total * 100) / 100,
    }));
    despesas_por_categoria.sort((a, b) => b.total - a.total);

    const resultado = Math.round((receita_total - despesas_total) * 100) / 100;

    return {
      mes,
      ano,
      receita_total,
      despesas_total,
      despesas_por_categoria,
      resultado,
    };
  }
}
