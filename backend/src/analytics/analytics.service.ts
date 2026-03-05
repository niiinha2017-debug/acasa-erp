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

  /** Status de projetos (substitui o antigo status-obras; tabela obras foi removida) */
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
    const fimMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [orcamentosTotal, orcamentosComVenda, vendasMes, contratosTotal] =
      await Promise.all([
        this.prisma.orcamentos.count(),
        this.prisma.orcamentos.count({ where: { venda: { isNot: null } } }),
        this.prisma.vendas.count({
          where: { data_venda: { gte: inicioMes, lte: fimMes } },
        }),
        this.prisma.contratos.count(),
      ]);

    const orcamentosSemVenda = Math.max(
      0,
      orcamentosTotal - orcamentosComVenda,
    );
    return {
      orcamentos_em_andamento: orcamentosTotal,
      orcamentos_aprovados_sem_venda: orcamentosSemVenda,
      vendas_fechadas_mes: vendasMes,
      contratos_total: contratosTotal,
    };
  }

  /** Resumo individual do vendedor logado para visão geral comercial. */
  async getResumoVendedor(user: {
    id?: number | null;
    funcionario_id?: number | null;
    nome?: string | null;
    usuario?: string | null;
  }): Promise<{
    vendedor: string | null;
    vendedor_usuario_id: number | null;
    vendedor_funcionario_id: number | null;
    fonte_vendedor: string;
    link_referencia: string;
    minhas_vendas_total: number;
    minhas_vendas_mes: number;
    minhas_em_producao: number;
    minhas_finalizadas: number;
  }> {
    let usuarioId = Number(user?.id || 0) || null;
    let funcionarioId = Number(user?.funcionario_id || 0) || null;
    let nome =
      String(user?.nome || '').trim() ||
      String(user?.usuario || '').trim() ||
      null;

    // Resolve identificadores e nome com fallback para cadastros legados.
    if (usuarioId || funcionarioId) {
      if (usuarioId) {
        const usuario = await this.prisma.usuarios.findUnique({
          where: { id: usuarioId },
          select: { nome: true, usuario: true, funcionario_id: true },
        });
        if (usuario) {
          funcionarioId =
            funcionarioId || Number(usuario.funcionario_id || 0) || null;
          nome =
            nome ||
            String(usuario.nome || '').trim() ||
            String(usuario.usuario || '').trim() ||
            null;
        }
      }

      if (funcionarioId) {
        const funcionario = await this.prisma.funcionarios.findUnique({
          where: { id: funcionarioId },
          select: { nome: true, usuario_id: true },
        });
        if (funcionario) {
          usuarioId = usuarioId || Number(funcionario.usuario_id || 0) || null;
          nome = nome || String(funcionario.nome || '').trim() || null;
        }
      }
    }

    if (!usuarioId && !funcionarioId && !nome) {
      return {
        vendedor: null,
        vendedor_usuario_id: null,
        vendedor_funcionario_id: null,
        fonte_vendedor: 'Usuário autenticado',
        link_referencia: '/vendas/fechamento',
        minhas_vendas_total: 0,
        minhas_vendas_mes: 0,
        minhas_em_producao: 0,
        minhas_finalizadas: 0,
      };
    }

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const vendas = await this.prisma.vendas.findMany({
      select: {
        id: true,
        status: true,
        data_venda: true,
        representante_venda_usuario_id: true,
        representante_venda_funcionario_id: true,
        representante_venda_nome: true,
        comissoes: {
          select: {
            tipo_comissao_chave: true,
            responsavel_usuario_id: true,
            responsavel_funcionario_id: true,
            responsavel_nome: true,
          },
        },
      },
      where: {
        OR: [
          ...(usuarioId ? [{ representante_venda_usuario_id: usuarioId }] : []),
          ...(funcionarioId
            ? [{ representante_venda_funcionario_id: funcionarioId }]
            : []),
          ...(nome ? [{ representante_venda_nome: nome }] : []),
          ...(usuarioId
            ? [
                {
                  comissoes: {
                    some: { responsavel_usuario_id: usuarioId },
                  },
                },
              ]
            : []),
          ...(funcionarioId
            ? [
                {
                  comissoes: {
                    some: { responsavel_funcionario_id: funcionarioId },
                  },
                },
              ]
            : []),
          ...(nome
            ? [
                {
                  comissoes: { some: { responsavel_nome: nome } },
                },
              ]
            : []),
        ],
      },
    });

    const normalize = (s: string) =>
      String(s || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');

    const statusProducao = [
      'PRODUCAO_AGENDADA',
      'EM_PRODUCAO',
      'PRODUCAO_FINALIZADA',
    ];
    const statusFinalizadas = ['MONTAGEM_FINALIZADA', 'ENCERRADO'];

    let emProducao = 0;
    let finalizadas = 0;
    let vendasMes = 0;

    for (const v of vendas) {
      const key = normalize(v.status);
      if (
        statusProducao.some((x) => key.includes(x) || key === 'EM_PRODUCAO')
      ) {
        emProducao += 1;
      }
      if (statusFinalizadas.some((x) => key === x)) {
        finalizadas += 1;
      }

      if (v.data_venda && v.data_venda >= inicioMes && v.data_venda <= fimMes) {
        vendasMes += 1;
      }
    }

    return {
      vendedor: nome,
      vendedor_usuario_id: usuarioId,
      vendedor_funcionario_id: funcionarioId,
      fonte_vendedor:
        'Usuário autenticado (ID) com fallback de nome por usuário/funcionário e vínculo por usuário, funcionário e nome legado',
      link_referencia: '/vendas/fechamento',
      minhas_vendas_total: vendas.length,
      minhas_vendas_mes: vendasMes,
      minhas_em_producao: emProducao,
      minhas_finalizadas: finalizadas,
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
    const statusProducao = [
      'PRODUCAO_AGENDADA',
      'EM_PRODUCAO',
      'PRODUCAO_FINALIZADA',
    ];
    const statusFinalizadas = ['MONTAGEM_FINALIZADA', 'ENCERRADO'];
    const normalize = (s: string) =>
      String(s || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
    let emProducao = 0;
    let finalizadas = 0;
    for (const v of vendas) {
      const key = normalize(v.status);
      if (statusProducao.some((x) => key.includes(x) || key === 'EM_PRODUCAO'))
        emProducao += 1;
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
  async getDreDespesas(
    inicio?: string,
    fim?: string,
  ): Promise<{ mes: string; categoria: string; total: number }[]> {
    const hoje = new Date();
    const dtInicio = inicio
      ? new Date(inicio)
      : new Date(hoje.getFullYear(), 0, 1);
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
    result.sort((a, b) =>
      (a.mes + a.categoria).localeCompare(b.mes + b.categoria),
    );
    return result;
  }

  /**
   * DRE mensal (Demonstração do Resultado do Exercício) por competência.
   * Receita = venda loja (vendas) + venda plano de corte.
   * Deduções: custo da compra, custo hora de produção, despesas do período.
   */
  async getDreMensal(
    mes: number,
    ano: number,
  ): Promise<{
    mes: number;
    ano: number;
    receita_venda_loja: number;
    receita_venda_plano_corte: number;
    receita_total: number;
    custo_compra: number;
    custo_hora_producao: number;
    despesas_total: number;
    despesas_por_categoria: { categoria: string; total: number }[];
    resultado: number;
  }> {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;

    // Receita: venda loja (vendas com data_venda no mês)
    const [vendasLoja, planoCorteMes, comprasMes] = await Promise.all([
      this.prisma.vendas.aggregate({
        where: {
          data_venda: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valor_total: true },
      }),
      this.prisma.plano_corte.aggregate({
        where: {
          data_venda: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valor_total: true },
      }),
      this.prisma.compras.aggregate({
        where: {
          data_compra: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valor_total: true },
      }),
    ]);

    let apontamentosMes: {
      horas: unknown;
      custo_calculado: unknown;
      funcionario: { custo_hora: unknown } | null;
    }[] = [];
    try {
      apontamentosMes = await this.prisma
        .apontamento_producao.findMany({
          where: { data: { gte: inicioMes, lte: fimMes } },
          select: {
            horas: true,
            custo_calculado: true,
            funcionario: { select: { custo_hora: true } },
          },
        })
        .catch(() => [] as typeof apontamentosMes);
    } catch {
      // Tabela apontamento_producao pode não existir se a migração não foi aplicada
    }

    const receita_venda_loja =
      Math.round(Number(vendasLoja._sum.valor_total ?? 0) * 100) / 100;
    const receita_venda_plano_corte =
      Math.round(Number(planoCorteMes._sum.valor_total ?? 0) * 100) / 100;
    const receita_total =
      Math.round((receita_venda_loja + receita_venda_plano_corte) * 100) / 100;

    const custo_compra =
      Math.round(Number(comprasMes._sum.valor_total ?? 0) * 100) / 100;

    let custo_hora_producao = 0;
    for (const ap of apontamentosMes) {
      const custo = Number(ap.custo_calculado ?? 0);
      if (custo > 0) {
        custo_hora_producao += custo;
      } else {
        const horas = Number(ap.horas ?? 0);
        const custoHora = Number(ap.funcionario?.custo_hora ?? 0);
        custo_hora_producao += horas * custoHora;
      }
    }
    custo_hora_producao = Math.round(custo_hora_producao * 100) / 100;

    // Despesas do período: mesmo critério de getDreDespesas, filtrado ao mês
    const dreDespesas = await this.getDreDespesas(
      `${ano}-${String(mes).padStart(2, '0')}-01`,
      `${ano}-${String(mes).padStart(2, '0')}-31`,
    );
    const despesasPorCategoria = new Map<string, number>();
    let despesas_total = 0;
    for (const d of dreDespesas) {
      if (d.mes !== mesStr) continue;
      despesas_total += d.total;
      despesasPorCategoria.set(
        d.categoria,
        (despesasPorCategoria.get(d.categoria) ?? 0) + d.total,
      );
    }
    despesas_total = Math.round(despesas_total * 100) / 100;

    const despesas_por_categoria = Array.from(
      despesasPorCategoria.entries(),
    ).map(([categoria, total]) => ({
      categoria,
      total: Math.round(total * 100) / 100,
    }));
    despesas_por_categoria.sort((a, b) => b.total - a.total);

    const resultado =
      Math.round(
        (receita_total -
          custo_compra -
          custo_hora_producao -
          despesas_total) *
          100,
      ) / 100;

    return {
      mes,
      ano,
      receita_venda_loja,
      receita_venda_plano_corte,
      receita_total,
      custo_compra,
      custo_hora_producao,
      despesas_total,
      despesas_por_categoria,
      resultado,
    };
  }

  /**
   * DRE do plano de corte: receita apenas de plano_corte (data_venda no mês).
   * Sem custo de compra (plano de corte não tem compra). Custo hora e despesas rateados pela participação na receita total.
   */
  async getDrePlanoCorte(
    mes: number,
    ano: number,
  ): Promise<{
    mes: number;
    ano: number;
    receita: number;
    custo_hora_producao_rateado: number;
    despesas_total_rateado: number;
    resultado: number;
  }> {
    const dre = await this.getDreMensal(mes, ano);
    const receita = dre.receita_venda_plano_corte;
    const receitaTotal = dre.receita_total;
    const rateio =
      receitaTotal > 0 ? receita / receitaTotal : 0;
    const custo_hora_producao_rateado =
      Math.round(dre.custo_hora_producao * rateio * 100) / 100;
    const despesas_total_rateado =
      Math.round(dre.despesas_total * rateio * 100) / 100;
    const resultado =
      Math.round(
        (receita - custo_hora_producao_rateado - despesas_total_rateado) * 100,
      ) / 100;
    return {
      mes: dre.mes,
      ano: dre.ano,
      receita,
      custo_hora_producao_rateado,
      despesas_total_rateado,
      resultado,
    };
  }

  /**
   * DRE do período detalhada por produção (venda) de cada cliente e por ambiente registrado.
   * Cada linha = um ambiente de uma venda (cliente + venda + ambiente): receita, custo compra, custo produção rateado, resultado.
   */
  async getDrePeriodoPorClienteAmbiente(
    mes: number,
    ano: number,
  ): Promise<{
    mes: number;
    ano: number;
    linhas: {
      cliente_id: number;
      cliente_nome: string;
      venda_id: number;
      data_venda: string;
      nome_ambiente: string;
      receita: number;
      custo_compra: number;
      custo_hora_producao: number;
      despesas_periodo_rateado: number;
      resultado: number;
    }[];
    despesas_periodo: number;
  }> {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const vendas = await this.prisma.vendas.findMany({
      where: { data_venda: { gte: inicioMes, lte: fimMes } },
      select: {
        id: true,
        data_venda: true,
        cliente_id: true,
        cliente: { select: { nome_fantasia: true, nome_completo: true } },
        itens: { select: { id: true, nome_ambiente: true, valor_total: true } },
      },
      orderBy: [{ cliente: { nome_fantasia: 'asc' } }, { data_venda: 'asc' }],
    });

    type Key = string;
    const receitaMap = new Map<Key, number>();
    const custoCompraMap = new Map<Key, number>();
    const vendaInfoMap = new Map<
      Key,
      { cliente_id: number; cliente_nome: string; venda_id: number; data_venda: Date }
    >();

    for (const v of vendas) {
      const clienteNome =
        v.cliente?.nome_fantasia ||
        v.cliente?.nome_completo ||
        'Cliente';
      for (const item of v.itens) {
        const key: Key = `${v.id}|${item.nome_ambiente}`;
        const receita = Number(item.valor_total ?? 0);
        receitaMap.set(key, (receitaMap.get(key) ?? 0) + receita);
        if (!vendaInfoMap.has(key)) {
          vendaInfoMap.set(key, {
            cliente_id: v.cliente_id,
            cliente_nome: clienteNome,
            venda_id: v.id,
            data_venda: v.data_venda,
          });
        }
      }
    }

    const vendaIds = vendas.map((x) => x.id);
    if (vendaIds.length > 0) {
      // Compras vinculadas às vendas do período: inclui todas (sem filtrar por data_compra) para o custo do cliente entrar na DRE
      const compras = await this.prisma.compras.findMany({
        where: { venda_id: { in: vendaIds } },
        select: {
          id: true,
          venda_id: true,
          venda_item_id: true,
          valor_total: true,
          venda_item: { select: { nome_ambiente: true } },
          rateios: { select: { nome_ambiente: true, valor_alocado: true } },
        },
      });

      for (const c of compras) {
        const vendaId = c.venda_id!;
        const valorTotal = Number(c.valor_total ?? 0);
        if (c.venda_item_id != null && c.venda_item?.nome_ambiente) {
          const key: Key = `${vendaId}|${c.venda_item.nome_ambiente}`;
          custoCompraMap.set(key, (custoCompraMap.get(key) ?? 0) + valorTotal);
        } else if (c.rateios?.length) {
          for (const r of c.rateios) {
            const key: Key = `${vendaId}|${r.nome_ambiente}`;
            custoCompraMap.set(
              key,
              (custoCompraMap.get(key) ?? 0) + Number(r.valor_alocado ?? 0),
            );
          }
        }
      }
    }

    const custoProducaoPorVenda = new Map<number, number>();
    if (vendaIds.length > 0) {
      try {
        const apontamentos = await this.prisma.apontamento_producao.findMany({
          where: {
            data: { gte: inicioMes, lte: fimMes },
            venda_id: { in: vendaIds },
          },
        select: {
          venda_id: true,
          horas: true,
          custo_calculado: true,
          funcionario: { select: { custo_hora: true } },
        },
      });
      for (const ap of apontamentos) {
        const vid = ap.venda_id ?? 0;
        if (vid === 0) continue;
        let custo = Number(ap.custo_calculado ?? 0);
        if (custo <= 0) {
          const horas = Number(ap.horas ?? 0);
          const ch = Number(ap.funcionario?.custo_hora ?? 0);
          custo = horas * ch;
        }
        custoProducaoPorVenda.set(
          vid,
          (custoProducaoPorVenda.get(vid) ?? 0) + custo,
        );
      }
      } catch {
        // tabela pode não existir
      }
    }

    const receitaPorVenda = new Map<number, number>();
    for (const [key, val] of receitaMap) {
      const vendaId = Number(key.split('|')[0]);
      receitaPorVenda.set(vendaId, (receitaPorVenda.get(vendaId) ?? 0) + val);
    }

    const linhas: {
      cliente_id: number;
      cliente_nome: string;
      venda_id: number;
      data_venda: string;
      nome_ambiente: string;
      receita: number;
      custo_compra: number;
      custo_hora_producao: number;
      despesas_periodo_rateado: number;
      resultado: number;
    }[] = [];

    for (const [key, receita] of receitaMap) {
      const info = vendaInfoMap.get(key);
      if (!info) continue;
      const [vendaIdStr, nomeAmbiente] = key.split('|');
      const vendaId = Number(vendaIdStr);
      const custo_compra = Math.round((custoCompraMap.get(key) ?? 0) * 100) / 100;
      const receitaVenda = receitaPorVenda.get(vendaId) ?? 1;
      const custoVenda = custoProducaoPorVenda.get(vendaId) ?? 0;
      const custo_hora_producao =
        receitaVenda > 0
          ? Math.round((custoVenda * (receita / receitaVenda)) * 100) / 100
          : 0;
      linhas.push({
        cliente_id: info.cliente_id,
        cliente_nome: info.cliente_nome,
        venda_id: info.venda_id,
        data_venda: info.data_venda.toISOString().slice(0, 10),
        nome_ambiente: nomeAmbiente,
        receita: Math.round(receita * 100) / 100,
        custo_compra,
        custo_hora_producao,
        despesas_periodo_rateado: 0,
        resultado: Math.round((receita - custo_compra - custo_hora_producao) * 100) / 100,
      });
    }

    const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
    const dreDespesas = await this.getDreDespesas(
      `${ano}-${String(mes).padStart(2, '0')}-01`,
      `${ano}-${String(mes).padStart(2, '0')}-31`,
    );
    let despesas_periodo = 0;
    for (const d of dreDespesas) {
      if (d.mes === mesStr) despesas_periodo += d.total;
    }
    despesas_periodo = Math.round(despesas_periodo * 100) / 100;

    const totalReceita = linhas.reduce((s, l) => s + l.receita, 0);
    for (const linha of linhas) {
      const despesas_periodo_rateado =
        totalReceita > 0
          ? Math.round((despesas_periodo * (linha.receita / totalReceita)) * 100) / 100
          : 0;
      linha.despesas_periodo_rateado = despesas_periodo_rateado;
      linha.resultado = Math.round(
        (linha.receita - linha.custo_compra - linha.custo_hora_producao - despesas_periodo_rateado) * 100,
      ) / 100;
    }

    return {
      mes,
      ano,
      linhas,
      despesas_periodo,
    };
  }
}
