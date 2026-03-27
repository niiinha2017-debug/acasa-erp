import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DreDetalhadaService } from '../relatorios/dre-detalhada.service';

/** Status de projeto considerados "Montagem Concluída" para comissão da fábrica. */
const STATUS_MONTAGEM_CONCLUIDA = ['MONTAGEM_FINALIZADA', 'ENCERRADO'];

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class ComissaoProducaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dreDetalhada: DreDetalhadaService,
  ) {}

  /**
   * Resumo da comissão de produtividade da fábrica no mês.
   * Gatilho: somente projetos com status "Montagem Concluída".
   * Base: Lucro Líquido do ambiente (DRE completa por ambiente).
   * Se lucro > 0: 50% Margem Fábrica (retenção), 50% Fundo de Comissão (distribuição).
   * Agora retorna detalhamento completo por ambiente e por funcionário.
   */
  async getResumo(mes: number, ano: number) {
    const projetosConcluidosNaMatriz =
      await this.prisma.agenda_fabrica.findMany({
        where: {
          projeto_id: { not: null },
          status: { not: 'CANCELADO' },
          execucao_etapa: 'CONCLUIDO',
          OR: [
            { subetapa: 'MONTAGEM' },
            { subetapa: 'SERVICO_CORTE_FITA_BORDA' },
          ],
        },
        select: { projeto_id: true },
        distinct: ['projeto_id'],
      });
    const idsProjetosMatriz = projetosConcluidosNaMatriz
      .map((r) => Number((r as any).projeto_id || 0))
      .filter((id) => id > 0);

    const projetosElegiveis = await this.prisma.projetos.findMany({
      where: {
        OR: [
          { status_atual: { in: STATUS_MONTAGEM_CONCLUIDA } },
          ...(idsProjetosMatriz.length ? [{ id: { in: idsProjetosMatriz } }] : []),
        ],
        venda_id: { not: null },
      },
      select: {
        id: true,
        codigo: true,
        venda_id: true,
        cliente_id: true,
        cliente: { select: { nome_completo: true, nome_fantasia: true, razao_social: true } },
      },
    });

    const projetosResumo: Array<{
      projeto_id: number;
      codigo: string;
      cliente_nome: string;
      lucro_liquido: number;
      contribuicao_fundo: number;
      margem_fabrica: number;
      ambientes: Array<{
        nome_ambiente: string;
        valor_contrato: number;
        materiais_diretos: number;
        custo_mao_de_obra: number;
        custo_estrutura: number;
        rateio_despesas_fixas: number;
        lucro_liquido: number;
        custo_por_etapa: any[];
        detalhamento_compras: any[];
        detalhamento_despesas: any[];
        compras_acumuladas_projeto: any;
      }>;
    }> = [];

    let totalLucroGerado = 0;
    let totalComissaoDisponivel = 0;
    // Agrupamento global de funcionários (soma horas e custo de todos os projetos)
    const funcionariosGlobal = new Map<
      number,
      { nome: string; horas: number; custo: number; projetos: Set<number> }
    >();

    for (const proj of projetosElegiveis) {
      const vendaId = (proj as any).venda_id;
      const itens = await this.prisma.vendas_itens.findMany({
        where: { venda_id: vendaId },
        select: { nome_ambiente: true },
      });

      let lucroProjeto = 0;
      const ambientesDre: typeof projetosResumo[0]['ambientes'] = [];

      for (const item of itens) {
        const dre = await this.dreDetalhada.getDreAmbiente(
          (proj as any).id,
          (item as any).nome_ambiente,
          mes,
          ano,
        );
        if (!dre) continue;
        const lucroAmb = Number((dre as any).lucro_liquido ?? 0);
        lucroProjeto += lucroAmb;

        ambientesDre.push({
          nome_ambiente: (dre as any).nome_ambiente ?? (item as any).nome_ambiente,
          valor_contrato: Number((dre as any).valor_contrato ?? 0),
          materiais_diretos: Number((dre as any).materiais_diretos ?? 0),
          custo_mao_de_obra: Number((dre as any).custo_mao_de_obra ?? 0),
          custo_estrutura: Number((dre as any).custo_estrutura ?? 0),
          rateio_despesas_fixas: Number((dre as any).rateio_despesas_fixas ?? 0),
          lucro_liquido: round2(lucroAmb),
          custo_por_etapa: (dre as any).custo_por_etapa ?? [],
          detalhamento_compras: (dre as any).detalhamento_compras ?? [],
          detalhamento_despesas: (dre as any).detalhamento_despesas ?? [],
          compras_acumuladas_projeto: (dre as any).compras_acumuladas_projeto ?? { total: 0, por_tipo: [] },
        });

        // Acumular funcionários globalmente a partir do custo_por_etapa
        const etapas = (dre as any).custo_por_etapa ?? [];
        for (const etapa of etapas) {
          for (const f of etapa.funcionarios ?? []) {
            const cur = funcionariosGlobal.get(f.funcionario_id) ?? {
              nome: f.funcionario_nome ?? '',
              horas: 0,
              custo: 0,
              projetos: new Set<number>(),
            };
            cur.horas += Number(f.horas ?? 0);
            cur.custo += Number(f.custo ?? 0);
            cur.projetos.add((proj as any).id);
            funcionariosGlobal.set(f.funcionario_id, cur);
          }
        }
      }
      lucroProjeto = round2(lucroProjeto);

      if (lucroProjeto <= 0) continue;

      const margemFabrica = round2(lucroProjeto * 0.5);
      const contribuicaoFundo = round2(lucroProjeto * 0.5);

      totalLucroGerado += lucroProjeto;
      totalComissaoDisponivel += contribuicaoFundo;

      const cliente = proj as any;
      const clienteNome =
        cliente.cliente?.nome_fantasia ||
        cliente.cliente?.nome_completo ||
        cliente.cliente?.razao_social ||
        `Cliente #${cliente.cliente_id}`;

      projetosResumo.push({
        projeto_id: (proj as any).id,
        codigo: (proj as any).codigo,
        cliente_nome: clienteNome,
        lucro_liquido: lucroProjeto,
        contribuicao_fundo: contribuicaoFundo,
        margem_fabrica: margemFabrica,
        ambientes: ambientesDre,
      });
    }

    // Buscar o percentual de comissão cadastrado de cada funcionário que participou
    const funcIds = Array.from(funcionariosGlobal.keys());
    const totalHorasGlobal = Array.from(funcionariosGlobal.values()).reduce((s, f) => s + f.horas, 0);
    const funcComPercentual = funcIds.length
      ? await this.prisma.funcionarios.findMany({
          where: { id: { in: funcIds } },
          select: { id: true, comissao_producao_percentual: true },
        })
      : [];
    const percentualMap = new Map<number, number>();
    for (const f of funcComPercentual) {
      percentualMap.set(f.id, Number((f as any).comissao_producao_percentual ?? 0));
    }

    // Participação de cada funcionário no fundo (baseada no % individual cadastrado)
    const comissaoDisponivel = round2(totalComissaoDisponivel);
    const totalPercentualCadastrado = Array.from(funcionariosGlobal.keys()).reduce(
      (s, id) => s + (percentualMap.get(id) ?? 0),
      0,
    );
    const participacao_funcionarios = Array.from(funcionariosGlobal.entries())
      .map(([funcionario_id, f]) => {
        const percCadastrado = percentualMap.get(funcionario_id) ?? 0;
        // Normaliza: se a soma dos % cadastrados for > 0, distribui proporcional
        const percEfetivo = totalPercentualCadastrado > 0
          ? percCadastrado / totalPercentualCadastrado
          : 0;
        return {
          funcionario_id,
          funcionario_nome: f.nome,
          horas: round2(f.horas),
          custo: round2(f.custo),
          custo_hora: f.horas > 0 ? round2(f.custo / f.horas) : 0,
          projetos_count: f.projetos.size,
          percentual_cadastrado: percCadastrado,
          percentual_participacao: round2(percEfetivo * 100),
          valor_comissao: round2(comissaoDisponivel * percEfetivo),
        };
      })
      .sort((a, b) => b.valor_comissao - a.valor_comissao);

    return {
      mes,
      ano,
      total_lucro_gerado: round2(totalLucroGerado),
      total_comissao_disponivel: comissaoDisponivel,
      total_horas_producao: round2(totalHorasGlobal),
      projetos: projetosResumo,
      participacao_funcionarios,
    };
  }
}
