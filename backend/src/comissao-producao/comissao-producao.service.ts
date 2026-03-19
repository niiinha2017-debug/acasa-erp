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
   * Base: Lucro Líquido do ambiente (Valor Contrato - Impostos - Materiais - Custo Hora - Rateios).
   * Se lucro > 0: 50% Margem Fábrica (retenção), 50% Fundo de Comissão (distribuição).
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
    }> = [];

    let totalLucroGerado = 0;
    let totalComissaoDisponivel = 0;

    for (const proj of projetosElegiveis) {
      const vendaId = (proj as any).venda_id;
      const itens = await this.prisma.vendas_itens.findMany({
        where: { venda_id: vendaId },
        select: { nome_ambiente: true },
      });

      let lucroProjeto = 0;
      for (const item of itens) {
        const dre = await this.dreDetalhada.getDreAmbiente(
          (proj as any).id,
          (item as any).nome_ambiente,
          mes,
          ano,
        );
        if (dre && (dre as any).lucro_liquido != null) {
          lucroProjeto += Number((dre as any).lucro_liquido);
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
      });
    }

    return {
      mes,
      ano,
      total_lucro_gerado: round2(totalLucroGerado),
      total_comissao_disponivel: round2(totalComissaoDisponivel),
      projetos: projetosResumo,
    };
  }
}
