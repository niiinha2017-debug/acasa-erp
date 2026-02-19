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
}
