import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustosEstruturaService,
  CATEGORIAS_DESPESA_FIXA_SALARIOS,
} from '../financeiro/custos-estrutura.service';

const CATEGORIAS_MATERIAIS = ['INSUMO', 'MATERIA_PRIMA', 'MATERIA PRIMA', 'INSUMOS'];

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Overrides para DRE quando o valor vem da OS de importação/markup (não do item da venda). */
export type DreAmbienteOptsImportacao = {
  fonte_importacao_leitura: true;
  valor_contrato: number;
  impostos: number;
  valor_total_venda: number;
  venda_id: number | null;
  cliente_id: number;
};

type DreFluxoAmbiente = 'VENDA' | 'IMPORTACAO' | 'GARANTIA';

@Injectable()
export class DreDetalhadaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly custosEstrutura: CustosEstruturaService,
  ) {}

  /** Busca clientes por nome (para autocomplete). */
  async buscarClientes(q?: string) {
    const where: any = {};
    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [
        { nome_completo: { contains: term } },
        { nome_fantasia: { contains: term } },
        { razao_social: { contains: term } },
      ];
    } else {
      // Sem termo de busca: exige pelo menos 2 caracteres no frontend, mas previne query sem filtro
      return [];
    }
    const clientes = await this.prisma.cliente.findMany({
      where,
      select: { id: true, nome_completo: true, nome_fantasia: true, razao_social: true },
      orderBy: { nome_completo: 'asc' },
      take: 30,
    });
    return clientes.map((c) => {
      const nomeFantasia = String((c as any).nome_fantasia ?? '').trim();
      const nomeCompleto = String((c as any).nome_completo ?? '').trim();
      const razaoSocial = String((c as any).razao_social ?? '').trim();
      return {
        id: c.id,
        nome: nomeFantasia || nomeCompleto || razaoSocial || `Cliente #${c.id}`,
      };
    });
  }

  /**
   * Dashboard de consumo por projeto: Área Útil (Peças), Retalhos, Perda Real e constante de perda padrão.
   * Usado no gráfico de pizza e na validação "Perda acima do esperado".
   */
  async getDashboardConsumoProjeto(projetoId: number) {
    const agendas = await this.prisma.agenda_fabrica.findMany({
      where: {
        projeto_id: projetoId,
        status: { not: 'CANCELADO' },
        OR: [{ execucao_etapa: 'CONCLUIDO' }, { status: 'CONCLUIDO' }],
      },
      select: {
        area_pecas_m2: true,
        consumo_estimado_m2: true,
        consumo_real_m2: true,
        perda_real_m2: true,
        id: true,
      },
    });
    const areaPecas = agendas.reduce((s, a) => s + (a.area_pecas_m2 != null ? toNum(a.area_pecas_m2) : 0), 0);
    const perdaReal = agendas.reduce((s, a) => s + (a.perda_real_m2 != null ? toNum(a.perda_real_m2) : 0), 0);
    const agendaIds = agendas.map((a) => a.id);
    const retalhosAgg =
      agendaIds.length > 0
        ? await this.prisma.estoque_retalho.aggregate({
            where: { agenda_fabrica_id: { in: agendaIds } },
            _sum: { quantidade_m2: true },
          })
        : { _sum: { quantidade_m2: null } };
    const retalhos = retalhosAgg._sum?.quantidade_m2 != null ? toNum(retalhosAgg._sum.quantidade_m2) : 0;

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: 1 },
      select: { perda_padrao_percentual: true },
    });
    const perdaPadraoPercentual = empresa?.perda_padrao_percentual != null ? toNum(empresa.perda_padrao_percentual) : null;

    const projeto = await this.prisma.projetos.findUnique({
      where: { id: projetoId },
      select: { codigo: true },
    });

    return {
      projeto_id: projetoId,
      codigo: (projeto as any)?.codigo ?? `Projeto #${projetoId}`,
      area_pecas_m2: round2(areaPecas),
      retalhos_m2: round2(retalhos),
      perda_real_m2: round2(perdaReal),
      perda_padrao_percentual: perdaPadraoPercentual,
    };
  }

  /**
   * Ambientes para DRE: itens da venda (fluxo clássico) + etapas da última OS de importação/markup.
   */
  async listarAmbientes(clienteId: number) {
    // Valida se o cliente existe antes de buscar projetos
    const clienteExiste = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true },
    });
    if (!clienteExiste) {
      return { projeto: null, ordem_importacao: null, ambientes: [] };
    }

    const projetos = await this.prisma.projetos.findMany({
      where: { cliente_id: clienteId, venda_id: { not: null } },
      select: { id: true, codigo: true, venda_id: true },
      orderBy: { id: 'desc' },
      take: 1,
    });
    const projeto = projetos[0];
    let projetoRes: { id: number; codigo: string; venda_id: number } | null = null;
    const ambientes: Array<{
      fluxo: DreFluxoAmbiente;
      venda_item_id?: number;
      producao_etapa_id?: number;
      ordem_servico_id?: number;
      garantia_id?: number;
      nome_ambiente: string;
      valor_contrato: number;
      projeto_id: number | null;
      venda_id?: number | null;
    }> = [];

    if (projeto && (projeto as any).venda_id) {
      const vendaId = (projeto as any).venda_id;
      projetoRes = {
        id: (projeto as any).id,
        codigo: (projeto as any).codigo,
        venda_id: vendaId,
      };
      const itens = await this.prisma.vendas_itens.findMany({
        where: { venda_id: vendaId },
        select: { id: true, nome_ambiente: true, valor_total: true },
        orderBy: { id: 'asc' },
      });
      for (const i of itens) {
        ambientes.push({
          fluxo: 'VENDA',
          venda_item_id: (i as any).id,
          nome_ambiente: (i as any).nome_ambiente,
          valor_contrato: toNum((i as any).valor_total),
          projeto_id: (projeto as any).id,
          venda_id: vendaId,
        });
      }
    }

    const osImport = await this.prisma.ordem_servico.findFirst({
      where: { cliente_id: clienteId, origem: 'IMPORTACAO_LEITURA' },
      orderBy: { criado_em: 'desc' },
      include: {
        etapas: { orderBy: { ordem: 'asc' } },
      },
    });

    let ordem_importacao: {
      id: number;
      criado_em: Date;
      valor_bruto: number | null;
      valor_liquido: number | null;
      etapas_count: number;
    } | null = null;

    if (osImport) {
      const etapas = (osImport as any).etapas || [];
      const n = etapas.length > 0 ? etapas.length : 1;
      const brutoRaw = toNum((osImport as any).valor_bruto);
      const bruto = brutoRaw > 0
        ? brutoRaw
        : DreDetalhadaService.lerTotalMarkupSnapshot((osImport as any).comissionados);
      const porEtapa = bruto > 0 && n > 0 ? round2(bruto / n) : 0;
      ordem_importacao = {
        id: (osImport as any).id,
        criado_em: (osImport as any).criado_em,
        valor_bruto: bruto > 0 ? bruto : null,
        valor_liquido:
          (osImport as any).valor_liquido != null
            ? toNum((osImport as any).valor_liquido)
            : null,
        etapas_count: etapas.length,
      };
      const pid = projetoRes?.id ?? null;
      if (etapas.length === 0) {
        ambientes.push({
          fluxo: 'IMPORTACAO',
          ordem_servico_id: (osImport as any).id,
          nome_ambiente: 'Obra (importação — sem ambientes na OS)',
          valor_contrato: bruto,
          projeto_id: pid,
          venda_id: projetoRes?.venda_id ?? null,
        });
      } else {
        for (const e of etapas) {
          ambientes.push({
            fluxo: 'IMPORTACAO',
            producao_etapa_id: (e as any).id,
            ordem_servico_id: (osImport as any).id,
            nome_ambiente: (e as any).nome_ambiente || `Etapa #${(e as any).id}`,
            valor_contrato: porEtapa,
            projeto_id: pid,
            venda_id: projetoRes?.venda_id ?? null,
          });
        }
      }
    }

    const garantias = await this.prisma.garantias.findMany({
      where: {
        cliente_id: clienteId,
        status: { not: 'CANCELADA' },
      },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        valor_venda: true,
        venda_id: true,
        data_abertura: true,
      },
      orderBy: [{ data_abertura: 'desc' }, { id: 'desc' }],
    });

    for (const garantia of garantias) {
      const tipo = String((garantia as any).tipo || 'GARANTIA').toUpperCase();
      const prefixo =
        tipo === 'ASSISTENCIA'
          ? 'Assistência'
          : tipo === 'MANUTENCAO'
            ? 'Manutenção'
            : 'Garantia';
      const titulo = String((garantia as any).titulo || '').trim();
      ambientes.push({
        fluxo: 'GARANTIA',
        garantia_id: (garantia as any).id,
        nome_ambiente: titulo ? `${prefixo} - ${titulo}` : `${prefixo} #${(garantia as any).id}`,
        valor_contrato: toNum((garantia as any).valor_venda),
        projeto_id: projetoRes?.id ?? null,
        venda_id: (garantia as any).venda_id ?? projetoRes?.venda_id ?? null,
      });
    }

    return {
      projeto: projetoRes,
      ordem_importacao,
      ambientes,
    };
  }

  private static lerTotalMarkupSnapshot(comissionados: unknown): number {
    if (!comissionados || typeof comissionados !== 'object') return 0;
    const o = comissionados as Record<string, unknown>;
    if (o.schema !== 'MARKUP_V2') return 0;
    const total = toNum(o.total_markup);
    return total > 0 ? total : 0;
  }

  private static extrairParcelasMarkupSnapshot(comissionados: unknown): Array<{
    parcela: number;
    valor: number;
    vencimento: string | null;
    forma: string | null;
  }> {
    if (!comissionados || typeof comissionados !== 'object') return [];
    const com = comissionados as Record<string, unknown>;
    if (com.schema !== 'MARKUP_V2' || !Array.isArray(com.parcelas_markup)) return [];
    return com.parcelas_markup
      .filter((p: any) => p && typeof p === 'object' && toNum(p?.valor) > 0)
      .map((p: any, idx: number) => ({
        parcela: Number(p?.parcela ?? idx + 1),
        valor: toNum(p?.valor),
        vencimento: typeof p?.vencimento === 'string' ? p.vencimento : null,
        forma: typeof p?.forma === 'string' ? p.forma : null,
      }));
  }

  /**
   * DRE de uma etapa da OS de importação (markup). Usa custos da venda/projeto quando existirem;
   * senão devolve visão só do markup (parcelas / líquido) com custos zerados.
   */
  async getDreImportacaoEtapa(
    ordemServicoId: number,
    producaoEtapaId: number,
    mes: number,
    ano: number,
  ) {
    const os = await this.prisma.ordem_servico.findFirst({
      where: { id: ordemServicoId, origem: 'IMPORTACAO_LEITURA' },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
    });
    if (!os) return null;
    const etapas = (os as any).etapas || [];
    const etapa =
      producaoEtapaId > 0
        ? etapas.find((e: any) => e.id === producaoEtapaId)
        : null;
    if (producaoEtapaId > 0 && !etapa) return null;
    if (producaoEtapaId <= 0 && etapas.length > 0) return null;

    const n = etapas.length > 0 ? etapas.length : 1;
    const valorBrutoOs =
      toNum((os as any).valor_bruto) ||
      DreDetalhadaService.lerTotalMarkupSnapshot((os as any).comissionados);
    const impostosOs = toNum((os as any).valor_impostos_nf);
    // Sem valor bruto: não há dados financeiros suficientes para calcular DRE
    if (valorBrutoOs <= 0) {
      return this.buildDreSomenteImportacao(os as any, mes, ano, 0, 0, 0);
    }
    const valorContrato =
      etapas.length === 0 ? valorBrutoOs : round2(valorBrutoOs / n);
    const impostos =
      etapas.length === 0 ? impostosOs : round2(impostosOs / n);

    const clienteId = (os as any).cliente_id;
    if (!clienteId || !Number.isFinite(clienteId) || clienteId <= 0) {
      return this.buildDreSomenteImportacao(os as any, mes, ano, valorContrato, impostos, valorBrutoOs);
    }
    const projeto = await this.prisma.projetos.findFirst({
      where: { cliente_id: clienteId, venda_id: { not: null } },
      orderBy: { id: 'desc' },
      select: { id: true, venda_id: true },
    });

    if (projeto && (projeto as any).venda_id) {
      const venda = await this.prisma.vendas.findUnique({
        where: { id: (projeto as any).venda_id },
        select: { valor_total: true },
      });
      const valorTotalVenda = Math.max(toNum((venda as any)?.valor_total), valorBrutoOs) || 1;
      const nomeAmbiente =
        etapa && String((etapa as any).nome_ambiente || '').trim()
          ? String((etapa as any).nome_ambiente)
          : 'Obra (importação — sem ambientes na OS)';
      const dre = await this.getDreAmbiente((projeto as any).id, nomeAmbiente, mes, ano, {
        fonte_importacao_leitura: true,
        valor_contrato: valorContrato,
        impostos,
        valor_total_venda: valorTotalVenda,
        venda_id: (projeto as any).venda_id,
        cliente_id: clienteId,
      });
      const parcelas = DreDetalhadaService.extrairParcelasMarkupSnapshot((os as any).comissionados);
      if (dre && parcelas.length) {
        return { ...dre, parcelas_markup: parcelas };
      }
      return dre;
    }

    return this.buildDreSomenteImportacao(os as any, mes, ano, valorContrato, impostos, valorBrutoOs);
  }

  private buildDreSomenteImportacao(
    os: any,
    mes: number,
    ano: number,
    valorContrato: number,
    impostos: number,
    valorBrutoTotal: number,
  ) {
    const safeContrato = Math.max(toNum(valorContrato), 0);
    const safeImpostos = Math.max(toNum(impostos), 0);
    const parcelas_markup = DreDetalhadaService.extrairParcelasMarkupSnapshot(os?.comissionados);
    const lucroAprox = round2(safeContrato - safeImpostos);
    return {
      projeto_id: null,
      nome_ambiente: 'Importação / markup (sem projeto com venda)',
      mes,
      ano,
      valor_contrato: safeContrato,
      impostos: safeImpostos,
      materiais_diretos: 0,
      custo_mao_de_obra: 0,
      custo_estrutura: 0,
      horas_totem: 0,
      rateio_despesas_fixas: 0,
      lucro_liquido: lucroAprox,
      detalhamento_mao_obra: [],
      detalhamento_compras: [],
      compras_acumuladas_projeto: { total: 0, por_tipo: [] },
      custo_por_etapa: [],
      detalhamento_despesas: [],
      custo_fabrica_agregado: 0,
      variacao_eficiencia: {
        custo_individual: 0,
        custo_fabrica: 0,
        variacao: 0,
        percentual_sobre_media: 0,
      },
      taxa_absorcao_salarios: 0,
      perda_padrao_percentual: null,
      retalhos_m2: 0,
      perda_real_m2: 0,
      tempo_negociacao_dias: 0,
      tempo_fabrica_dias: 0,
      custo_comercial: 0,
      custo_producao: 0,
      fonte_dados: 'IMPORTACAO_SEM_PROJETO' as const,
      ordem_servico_id: os?.id ?? null,
      valor_bruto_os: Math.max(toNum(valorBrutoTotal), 0),
      valor_liquido_os:
        os?.valor_liquido != null ? toNum(os.valor_liquido) : null,
      parcelas_markup,
    };
  }

  async getDreGarantia(garantiaId: number, mes: number, ano: number) {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const garantia = await this.prisma.garantias.findUnique({
      where: { id: garantiaId },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        valor_venda: true,
        custo_produtos: true,
        custo_mao_obra_previsto: true,
        custo_fabrica_previsto: true,
        horas_previstas: true,
        criado_em: true,
        data_abertura: true,
        agendamentos: {
          select: {
            id: true,
            apontamentos_producao: {
              where: { data: { gte: inicioMes, lte: fimMes } },
              select: {
                horas: true,
                custo_calculado: true,
                funcionario: { select: { id: true, nome: true, custo_hora: true } },
              },
            },
          },
        },
      } as any,
    });
    if (!garantia) return null;

    const apontamentos = ((garantia as any).agendamentos || []).flatMap(
      (ag: any) => ag.apontamentos_producao || [],
    );

    let horasTotem = 0;
    let custoMaoDeObraReal = 0;
    const porFuncionario = new Map<number, { nome: string; horas: number; custo: number }>();
    for (const ap of apontamentos) {
      const horas = toNum((ap as any).horas);
      const custoCalculado = toNum((ap as any).custo_calculado);
      const custo = custoCalculado > 0 ? custoCalculado : horas * toNum((ap as any).funcionario?.custo_hora);
      horasTotem += horas;
      custoMaoDeObraReal += custo;

      const func = (ap as any).funcionario;
      if (func?.id) {
        const atual = porFuncionario.get(func.id) ?? { nome: func.nome ?? '', horas: 0, custo: 0 };
        atual.horas += horas;
        atual.custo += custo;
        porFuncionario.set(func.id, atual);
      }
    }

    const horasTotemArred = round2(horasTotem);
    const custoMaoDeObraPrevisto = toNum((garantia as any).custo_mao_obra_previsto);
    const custoMaoDeObra = round2(custoMaoDeObraReal > 0 ? custoMaoDeObraReal : custoMaoDeObraPrevisto);

    let custoEstrutura = 0;
    if (horasTotem > 0) {
      const taxaEstrutura = await this.custosEstrutura.getCustoHoraEstrutura(mes, ano);
      custoEstrutura = round2(horasTotem * taxaEstrutura);
    } else {
      custoEstrutura = round2(toNum((garantia as any).custo_fabrica_previsto));
    }

    const detalhamento_mao_obra = Array.from(porFuncionario.entries()).map(([funcionario_id, v]) => ({
      funcionario_id,
      funcionario_nome: v.nome,
      horas: round2(v.horas),
      custo_calculado: round2(v.custo),
    }));

    const tipoGarantia = String((garantia as any).tipo || 'GARANTIA').toUpperCase();
    const prefixo =
      tipoGarantia === 'ASSISTENCIA'
        ? 'Assistência'
        : tipoGarantia === 'MANUTENCAO'
          ? 'Manutenção'
          : 'Garantia';
    const titulo = String((garantia as any).titulo || '').trim();
    const nomeAmbiente = titulo ? `${prefixo} - ${titulo}` : `${prefixo} #${(garantia as any).id}`;
    const valorContrato = round2(toNum((garantia as any).valor_venda));
    const materiaisDiretos = round2(toNum((garantia as any).custo_produtos));
    const lucroLiquido = round2(valorContrato - materiaisDiretos - custoMaoDeObra - custoEstrutura);

    return {
      projeto_id: null,
      nome_ambiente: nomeAmbiente,
      mes,
      ano,
      valor_contrato: valorContrato,
      impostos: 0,
      materiais_diretos: materiaisDiretos,
      custo_mao_de_obra: custoMaoDeObra,
      custo_estrutura: custoEstrutura,
      horas_totem: horasTotemArred,
      rateio_despesas_fixas: 0,
      lucro_liquido: lucroLiquido,
      detalhamento_mao_obra,
      detalhamento_compras: materiaisDiretos > 0
        ? [{
            compra_id: (garantia as any).id,
            fornecedor_nome: prefixo,
            tipo_compra: 'POS_VENDA',
            valor: materiaisDiretos,
          }]
        : [],
      compras_acumuladas_projeto: {
        total: materiaisDiretos,
        por_tipo: materiaisDiretos > 0 ? [{ tipo: 'POS_VENDA', valor: materiaisDiretos }] : [],
      },
      custo_por_etapa: [],
      detalhamento_despesas: [],
      custo_fabrica_agregado: custoEstrutura,
      variacao_eficiencia: {
        custo_individual: custoMaoDeObra,
        custo_fabrica: custoEstrutura,
        variacao: round2(custoMaoDeObra - custoEstrutura),
        percentual_sobre_media: custoEstrutura > 0 ? round2(((custoMaoDeObra - custoEstrutura) / custoEstrutura) * 100) : 0,
      },
      taxa_absorcao_salarios: 0,
      perda_padrao_percentual: null,
      retalhos_m2: 0,
      perda_real_m2: 0,
      tempo_negociacao_dias: 0,
      tempo_fabrica_dias: 0,
      custo_comercial: 0,
      custo_producao: 0,
      fonte_dados: 'GARANTIA' as const,
      garantia_id: (garantia as any).id,
      garantia_tipo: tipoGarantia,
      horas_previstas: round2(toNum((garantia as any).horas_previstas)),
    };
  }

  /**
   * DRE por ambiente: competência por data de registro (data_compra para compras, data_registro para despesas).
   * Valor do Contrato - Impostos - Materiais Diretos - Custo Hora Efetivo - Rateio Despesas Fixas = Lucro Líquido.
   */
  /** Horas úteis por dia para custo de tempo (negociação e fábrica). */
  private static readonly HORAS_POR_DIA = 8;

  async getDreAmbiente(
    projetoId: number,
    nomeAmbiente: string,
    mes: number,
    ano: number,
    opts?: DreAmbienteOptsImportacao,
  ) {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const projeto = await this.prisma.projetos.findFirst({
      where: { id: projetoId },
      select: {
        id: true,
        venda_id: true,
        criado_em: true,
        orcamento_id: true,
        orcamento: { select: { criado_em: true } },
      },
    });
    if (!projeto || !(projeto as any).venda_id) {
      return null;
    }
    let vendaId = (projeto as any).venda_id as number;
    if (opts?.fonte_importacao_leitura && opts.venda_id != null) {
      vendaId = opts.venda_id;
    }

    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      select: {
        valor_total: true,
        valor_nota_fiscal: true,
        valor_taxa_pagamento: true,
        data_venda: true,
      },
    });
    // Venda pode ter sido excluída após importação — protege contra null
    if (!venda && !opts?.fonte_importacao_leitura) {
      return null;
    }

    let valorContrato: number;
    let impostos: number;
    let valorTotalVenda: number;

    if (opts?.fonte_importacao_leitura) {
      valorContrato = round2(opts.valor_contrato);
      impostos = round2(opts.impostos);
      valorTotalVenda = Math.max(toNum(opts.valor_total_venda), 1);
    } else {
      const item = await this.prisma.vendas_itens.findFirst({
        where: { venda_id: vendaId, nome_ambiente: nomeAmbiente },
        select: { id: true, valor_total: true },
      });
      if (!item) return null;
      valorContrato = toNum((item as any).valor_total);
      valorTotalVenda = toNum((venda as any)?.valor_total) || valorContrato || 1;
      const impostosVenda =
        toNum((venda as any)?.valor_nota_fiscal) + toNum((venda as any)?.valor_taxa_pagamento);
      impostos = round2((valorContrato / valorTotalVenda) * impostosVenda);
    }

    // Materiais diretos: compras com data_compra (referência) no mês, vinculadas a este venda, alocado ao ambiente
    const comprasMes = await this.prisma.compras.findMany({
      where: {
        venda_id: vendaId,
        data_compra: { gte: inicioMes, lte: fimMes },
      },
      select: {
        id: true,
        valor_total: true,
        tipo_compra: true,
        venda_item_id: true,
        fornecedor: { select: { id: true, nome_fantasia: true, razao_social: true } },
        rateios: { where: { nome_ambiente: nomeAmbiente }, select: { valor_alocado: true } },
        venda_item: { select: { nome_ambiente: true } },
      },
    });
    let materiaisDiretos = 0;
    const detalhamento_compras: Array<{
      compra_id: number;
      fornecedor_nome: string;
      tipo_compra: string;
      valor: number;
    }> = [];
    for (const c of comprasMes) {
      const itemAmbiente = (c as any).venda_item?.nome_ambiente === nomeAmbiente;
      let valorAlocado = 0;
      if (itemAmbiente) {
        valorAlocado = toNum((c as any).valor_total);
      } else {
        const rateio = (c as any).rateios?.[0];
        if (rateio) valorAlocado = toNum((rateio as any).valor_alocado);
      }
      if (valorAlocado > 0) {
        materiaisDiretos += valorAlocado;
        const forn = (c as any).fornecedor;
        detalhamento_compras.push({
          compra_id: (c as any).id,
          fornecedor_nome: forn?.nome_fantasia || forn?.razao_social || 'Sem fornecedor',
          tipo_compra: (c as any).tipo_compra || 'Outros',
          valor: round2(valorAlocado),
        });
      }
    }
    materiaisDiretos = round2(materiaisDiretos);

    // Compras totais acumuladas do projeto (todo o histórico, não só o mês)
    const comprasProjetoTotal = await this.prisma.compras.findMany({
      where: { venda_id: vendaId },
      select: {
        valor_total: true,
        tipo_compra: true,
        venda_item_id: true,
        rateios: { where: { nome_ambiente: nomeAmbiente }, select: { valor_alocado: true } },
        venda_item: { select: { nome_ambiente: true } },
      },
    });
    let comprasAcumuladas = 0;
    const compras_por_tipo: Map<string, number> = new Map();
    for (const c of comprasProjetoTotal) {
      const itemAmbiente = (c as any).venda_item?.nome_ambiente === nomeAmbiente;
      let valorAlocado = 0;
      if (itemAmbiente) {
        valorAlocado = toNum((c as any).valor_total);
      } else {
        const rateio = (c as any).rateios?.[0];
        if (rateio) valorAlocado = toNum((rateio as any).valor_alocado);
      }
      if (valorAlocado > 0) {
        comprasAcumuladas += valorAlocado;
        const tipo = (c as any).tipo_compra || 'Outros';
        compras_por_tipo.set(tipo, (compras_por_tipo.get(tipo) || 0) + valorAlocado);
      }
    }
    const detalhamento_compras_acumuladas = Array.from(compras_por_tipo.entries())
      .map(([tipo, valor]) => ({ tipo, valor: round2(valor) }))
      .sort((a, b) => b.valor - a.valor);

    // Custo mão de obra (individual: Custo_Funcionario_Alocado) e custo fábrica (coletivo) para auditoria
    const apOrImportacao: any[] = [
      { venda_id: vendaId },
      { agenda_fabrica: { projeto_id: projetoId } },
      { agenda_loja: { projeto_id: projetoId } },
    ];
    if (opts?.fonte_importacao_leitura && opts.cliente_id) {
      apOrImportacao.push(
        { agenda_fabrica: { cliente_id: opts.cliente_id } },
        { agenda_loja: { cliente_id: opts.cliente_id } },
      );
    }
    const apontamentos = await this.prisma.apontamento_producao.findMany({
      where: {
        data: { gte: inicioMes, lte: fimMes },
        OR: apOrImportacao,
      },
      select: {
        horas: true,
        custo_calculado: true,
        categoria: true,
        agenda_fabrica_id: true,
        agenda_loja_id: true,
        agenda_fabrica: { select: { subetapa: true } },
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
      },
    });
    let custoMaoDeObraProjeto = 0;
    let horasTotemProjeto = 0;
    const porFuncionario = new Map<number, { nome: string; horas: number; custo: number }>();
    // Agrupamento por etapa (categoria/subetapa) → funcionários
    const porEtapa = new Map<
      string,
      { horas: number; custo: number; funcionarios: Map<number, { nome: string; horas: number; custo: number }> }
    >();
    for (const ap of apontamentos) {
      const horas = toNum((ap as any).horas);
      horasTotemProjeto += horas;
      const custoCalc = toNum((ap as any).custo_calculado);
      const custo = custoCalc > 0 ? custoCalc : horas * toNum((ap as any).funcionario?.custo_hora);
      custoMaoDeObraProjeto += custo;
      const func = (ap as any).funcionario;
      if (func) {
        const cur = porFuncionario.get(func.id) ?? { nome: func.nome ?? '', horas: 0, custo: 0 };
        cur.horas += horas;
        cur.custo += custo;
        porFuncionario.set(func.id, cur);
      }
      // Agrupamento por etapa
      const etapaNome = (ap as any).agenda_fabrica?.subetapa || (ap as any).categoria || 'OUTROS';
      const etapa = porEtapa.get(etapaNome) ?? { horas: 0, custo: 0, funcionarios: new Map() };
      etapa.horas += horas;
      etapa.custo += custo;
      if (func) {
        const ef = etapa.funcionarios.get(func.id) ?? { nome: func.nome ?? '', horas: 0, custo: 0 };
        ef.horas += horas;
        ef.custo += custo;
        etapa.funcionarios.set(func.id, ef);
      }
      porEtapa.set(etapaNome, etapa);
    }
    const rateioAmbiente = valorTotalVenda > 0 ? valorContrato / valorTotalVenda : 0;
    const horasTotemAmbiente = round2(horasTotemProjeto * rateioAmbiente);

    // Custo mão de obra = Absorção da Despesa Fixa de Salários (tempo Totem × Taxa de Absorção)
    const taxaAbsorcao = await this.custosEstrutura.getTaxaAbsorcaoSalarios(mes, ano);
    const custoMaoDeObra = round2(horasTotemAmbiente * taxaAbsorcao);

    // Detalhamento: custo real individual (quem trabalhou e quanto custou), rateado ao ambiente
    const detalhamento_mao_obra = Array.from(porFuncionario.entries()).map(([funcionario_id, v]) => ({
      funcionario_id,
      funcionario_nome: v.nome,
      horas: round2(rateioAmbiente * v.horas),
      custo_calculado: round2(rateioAmbiente * v.custo),
    }));

    // Custo hora por etapa de produção com detalhamento por funcionário
    const custo_por_etapa = Array.from(porEtapa.entries()).map(([etapa, data]) => ({
      etapa,
      horas: round2(rateioAmbiente * data.horas),
      custo: round2(rateioAmbiente * data.custo),
      custo_hora: data.horas > 0 ? round2(data.custo / data.horas) : 0,
      funcionarios: Array.from(data.funcionarios.entries()).map(([funcionario_id, f]) => ({
        funcionario_id,
        funcionario_nome: f.nome,
        horas: round2(rateioAmbiente * f.horas),
        custo: round2(rateioAmbiente * f.custo),
        custo_hora: f.horas > 0 ? round2(f.custo / f.horas) : 0,
      })),
    }));

    // Custo_Tarefa_Fabrica (coletivo): soma dos custo_tarefa_fabrica das agendas envolvidas no projeto no mês, rateado ao ambiente (auditoria)
    const agendaFabricaIds = [...new Set(apontamentos.map((a: any) => a.agenda_fabrica_id).filter(Boolean))];
    const agendaLojaIds = [...new Set(apontamentos.map((a: any) => a.agenda_loja_id).filter(Boolean))];
    let custoFabricaAgregadoProjeto = 0;
    if (agendaFabricaIds.length) {
      const agendas = await this.prisma.agenda_fabrica.findMany({
        where: { id: { in: agendaFabricaIds } },
        select: { custo_tarefa_fabrica: true },
      });
      for (const a of agendas) {
        custoFabricaAgregadoProjeto += toNum((a as any).custo_tarefa_fabrica);
      }
    }
    if (agendaLojaIds.length) {
      const agendas = await this.prisma.agenda_loja.findMany({
        where: { id: { in: agendaLojaIds } },
        select: { custo_tarefa_fabrica: true },
      });
      for (const a of agendas) {
        custoFabricaAgregadoProjeto += toNum((a as any).custo_tarefa_fabrica);
      }
    }
    const custo_fabrica_agregado = round2(rateioAmbiente * custoFabricaAgregadoProjeto);

    // Custo real individual (apontamento × custo_hora) — para auditoria e variação; o lucro usa absorção (custoMaoDeObra)
    const custoRealIndividual = round2(rateioAmbiente * custoMaoDeObraProjeto);

    // Variação para o admin: equipe escalada acima ou abaixo da média de custo da fábrica
    const variacao = round2(custoRealIndividual - custo_fabrica_agregado);
    const percentual_sobre_media =
      custo_fabrica_agregado > 0
        ? round2(((custoRealIndividual - custo_fabrica_agregado) / custo_fabrica_agregado) * 100)
        : 0;
    const variacao_eficiencia = {
      custo_individual: custoRealIndividual,
      custo_fabrica: custo_fabrica_agregado,
      variacao,
      percentual_sobre_media,
    };
    const taxaEstrutura = await this.custosEstrutura.getCustoHoraEstrutura(mes, ano);
    const custoEstrutura = round2(horasTotemAmbiente * taxaEstrutura);

    // Projetos ativos no mês: têm compra (data_compra) ou apontamento (data) no mês
    const vendasComAtividade = await this.prisma.compras.findMany({
      where: { data_compra: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
      select: { venda_id: true },
      distinct: ['venda_id'],
    });
    const vendasComApontamento = await this.prisma.apontamento_producao.findMany({
      where: { data: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
      select: { venda_id: true },
      distinct: ['venda_id'],
    });
    const vendaIdsAtivos = new Set<number>();
    for (const r of vendasComAtividade) {
      if ((r as any).venda_id) vendaIdsAtivos.add((r as any).venda_id);
    }
    for (const r of vendasComApontamento) {
      if ((r as any).venda_id) vendaIdsAtivos.add((r as any).venda_id);
    }
    const nProjetosAtivos = vendaIdsAtivos.size || 1;

    // Outras despesas fixas (excluindo salários: salários já entram via Taxa de Absorção no custoMaoDeObra)
    const categoriasExcluidasRateio = [...CATEGORIAS_MATERIAIS, ...CATEGORIAS_DESPESA_FIXA_SALARIOS];
    const despesasFixasOutras = await this.prisma.despesas.findMany({
      where: {
        data_registro: { gte: inicioMes, lte: fimMes },
        categoria: { notIn: categoriasExcluidasRateio },
      },
      select: { valor_total: true, categoria: true },
    });
    const totalDespesasFixas = despesasFixasOutras.reduce((s, d) => s + toNum((d as any).valor_total), 0);
    const rateioPorProjeto = totalDespesasFixas / nProjetosAtivos;
    const rateioDespesasFixas = round2((valorContrato / valorTotalVenda) * rateioPorProjeto);

    // Detalhamento rateio de despesas por categoria
    const despPorCategoria = new Map<string, number>();
    for (const d of despesasFixasOutras) {
      const cat = (d as any).categoria || 'Outros';
      despPorCategoria.set(cat, (despPorCategoria.get(cat) || 0) + toNum((d as any).valor_total));
    }
    const rateioFracao = totalDespesasFixas > 0 ? rateioDespesasFixas / totalDespesasFixas : 0;
    const detalhamento_despesas = Array.from(despPorCategoria.entries())
      .map(([categoria, valorTotal]) => ({
        categoria,
        valor_total: round2(valorTotal * rateioFracao),
        percentual: totalDespesasFixas > 0 ? round2((valorTotal / totalDespesasFixas) * 100) : 0,
      }))
      .sort((a, b) => b.valor_total - a.valor_total);

    let lucroLiquido = round2(
      valorContrato - impostos - materiaisDiretos - custoMaoDeObra - custoEstrutura - rateioDespesasFixas,
    );

    // Perda padrão (%), retalhos e valor hora comercial (linha do tempo de custos)
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: 1 },
      select: { perda_padrao_percentual: true, valor_hora_comercial: true } as any,
    });
    const perdaPadraoPercentual = empresa?.perda_padrao_percentual != null
      ? toNum(empresa.perda_padrao_percentual)
      : null;
    const valorHoraComercial = (empresa as any)?.valor_hora_comercial != null ? toNum((empresa as any).valor_hora_comercial) : 0;

    // Data de conclusão do projeto (última tarefa fábrica concluída)
    const ultimaConclusao = await this.prisma.agenda_fabrica.aggregate({
      where: { projeto_id: projetoId, status: 'CONCLUIDO' },
      _max: { alterado_em: true },
    });
    const finishedAt = (ultimaConclusao as any)._max?.alterado_em
      ? new Date((ultimaConclusao as any)._max.alterado_em)
      : null;

    // Linha do tempo: cadastro → fechamento → conclusão (Custo Comercial e Custo de Produção)
    const createdAt = (projeto as any).orcamento?.criado_em
      ? new Date((projeto as any).orcamento.criado_em)
      : new Date((projeto as any).criado_em);
    const contractDate = (venda as any)?.data_venda ? new Date((venda as any).data_venda) : null;
    const msPorDia = 24 * 60 * 60 * 1000;
    const tempoNegociacaoDias =
      contractDate && contractDate.getTime() >= createdAt.getTime()
        ? Math.max(0, (contractDate.getTime() - createdAt.getTime()) / msPorDia)
        : 0;
    const tempoFabricaDias =
      contractDate && finishedAt && finishedAt.getTime() >= contractDate.getTime()
        ? Math.max(0, (finishedAt.getTime() - contractDate.getTime()) / msPorDia)
        : 0;
    const custoComercial = round2(tempoNegociacaoDias * DreDetalhadaService.HORAS_POR_DIA * valorHoraComercial);
    const custoProducaoTimeline = round2(tempoFabricaDias * DreDetalhadaService.HORAS_POR_DIA * taxaEstrutura);
    lucroLiquido = round2(lucroLiquido - custoComercial - custoProducaoTimeline);

    const agendasProjeto = await this.prisma.agenda_fabrica.findMany({
      where: { projeto_id: projetoId, status: 'CONCLUIDO' },
      select: { id: true },
    });
    const agendaIds = agendasProjeto.map((a) => a.id);
    const retalhosAgg = agendaIds.length
      ? await this.prisma.estoque_retalho.aggregate({
          where: {
            agenda_fabrica_id: { in: agendaIds },
            criado_em: { gte: inicioMes, lte: fimMes },
          },
          _sum: { quantidade_m2: true },
        })
      : { _sum: { quantidade_m2: null } };
    const retalhos_m2 = retalhosAgg._sum?.quantidade_m2 != null
      ? round2(Number(retalhosAgg._sum.quantidade_m2))
      : 0;

    // Perda real (desvio): soma dos perda_real_m2 das tarefas concluídas no mês (vinculadas ao projeto)
    const agendasConcluidasNoMes = await this.prisma.agenda_fabrica.findMany({
      where: {
        id: { in: agendaIds },
        status: 'CONCLUIDO',
        alterado_em: { gte: inicioMes, lte: fimMes },
      },
      select: { perda_real_m2: true } as any,
    });
    const perda_real_m2 = agendasConcluidasNoMes.reduce(
      (s, a: any) => s + (a.perda_real_m2 != null ? toNum(a.perda_real_m2) : 0),
      0,
    );

    return {
      projeto_id: projetoId,
      nome_ambiente: nomeAmbiente,
      mes,
      ano,
      valor_contrato: valorContrato,
      impostos,
      materiais_diretos: materiaisDiretos,
      custo_mao_de_obra: custoMaoDeObra,
      custo_estrutura: custoEstrutura,
      horas_totem: horasTotemAmbiente,
      rateio_despesas_fixas: rateioDespesasFixas,
      lucro_liquido: lucroLiquido,
      detalhamento_mao_obra: detalhamento_mao_obra,
      detalhamento_compras,
      compras_acumuladas_projeto: {
        total: round2(comprasAcumuladas),
        por_tipo: detalhamento_compras_acumuladas,
      },
      custo_por_etapa,
      detalhamento_despesas,
      custo_fabrica_agregado: custo_fabrica_agregado,
      variacao_eficiencia,
      taxa_absorcao_salarios: taxaAbsorcao,
      perda_padrao_percentual: perdaPadraoPercentual,
      retalhos_m2,
      perda_real_m2: round2(perda_real_m2),
      // Linha do tempo de custos (cérebro financeiro do projeto)
      tempo_negociacao_dias: round2(tempoNegociacaoDias),
      tempo_fabrica_dias: round2(tempoFabricaDias),
      custo_comercial: custoComercial,
      custo_producao: custoProducaoTimeline,
      ...(opts?.fonte_importacao_leitura
        ? { fonte_dados: 'IMPORTACAO_MARKUP' as const }
        : { fonte_dados: 'VENDA' as const }),
    };
  }

  /**
   * Resumo de prazos do mês: média de dias de negociação e de fábrica para todos os clientes/projetos ativos no mês.
   * Usado na visão geral da DRE Detalhada para comparar se o custo por cliente sobe por demora na venda ou na produção.
   */
  async getResumoPrazosMes(mes: number, ano: number) {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const msPorDia = 24 * 60 * 60 * 1000;

    const [vendasComCompra, vendasComApontamento] = await Promise.all([
      this.prisma.compras.findMany({
        where: { data_compra: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
        select: { venda_id: true },
        distinct: ['venda_id'],
      }),
      this.prisma.apontamento_producao.findMany({
        where: { data: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
        select: { venda_id: true },
        distinct: ['venda_id'],
      }),
    ]);
    const vendaIds = new Set<number>();
    vendasComCompra.forEach((r: any) => r.venda_id && vendaIds.add(r.venda_id));
    vendasComApontamento.forEach((r: any) => r.venda_id && vendaIds.add(r.venda_id));
    const vendaIdsList = Array.from(vendaIds);
    if (!vendaIdsList.length) {
      return {
        tempo_negociacao_medio_dias: 0,
        tempo_fabrica_medio_dias: 0,
        quantidade_projetos: 0,
      };
    }

    const projetos = await this.prisma.projetos.findMany({
      where: { venda_id: { in: vendaIdsList } },
      select: {
        id: true,
        venda_id: true,
        criado_em: true,
        orcamento_id: true,
        orcamento: { select: { criado_em: true } },
      },
    });
    const vendas = await this.prisma.vendas.findMany({
      where: { id: { in: vendaIdsList } },
      select: { id: true, data_venda: true },
    });
    const vendaById = new Map<number, any>();
    vendas.forEach((v: any) => vendaById.set(v.id, v));

    const prazos: Array<{ tempo_negociacao_dias: number; tempo_fabrica_dias: number }> = [];
    for (const p of projetos) {
      const venda = p.venda_id != null ? vendaById.get(p.venda_id) : null;
      const contractDate = venda?.data_venda ? new Date(venda.data_venda) : null;
      const createdAt = (p as any).orcamento?.criado_em
        ? new Date((p as any).orcamento.criado_em)
        : new Date((p as any).criado_em);
      if (!contractDate) continue;
      const tempoNeg = Math.max(0, (contractDate.getTime() - createdAt.getTime()) / msPorDia);

      const agg = await this.prisma.agenda_fabrica.aggregate({
        where: { projeto_id: (p as any).id, status: 'CONCLUIDO' },
        _max: { alterado_em: true },
      });
      const finishedAt = (agg as any)._max?.alterado_em ? new Date((agg as any)._max.alterado_em) : null;
      const tempoFabrica =
        contractDate && finishedAt && finishedAt.getTime() >= contractDate.getTime()
          ? Math.max(0, (finishedAt.getTime() - contractDate.getTime()) / msPorDia)
          : 0;
      prazos.push({
        tempo_negociacao_dias: tempoNeg,
        tempo_fabrica_dias: tempoFabrica,
      });
    }

    const n = prazos.length || 1;
    const tempoNegociacaoMedio = prazos.reduce((s, x) => s + x.tempo_negociacao_dias, 0) / n;
    const tempoFabricaMedio = prazos.reduce((s, x) => s + x.tempo_fabrica_dias, 0) / n;
    return {
      tempo_negociacao_medio_dias: round2(tempoNegociacaoMedio),
      tempo_fabrica_medio_dias: round2(tempoFabricaMedio),
      quantidade_projetos: prazos.length,
    };
  }

  /**
   * Dados agregados para gráficos de validação (uma rodada de queries otimizadas).
   * Retorna: composição do custo (materiais, custo hora, impostos, lucro), lucro por ambiente, meta de comissão.
   */
  async getGraficosValidacao(mes: number, ano: number, metaComissao?: number) {
    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const [vendasComCompra, vendasComApontamento, despesasFixas] = await Promise.all([
      this.prisma.compras.findMany({
        where: { data_compra: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
        select: { venda_id: true },
        distinct: ['venda_id'],
      }),
      this.prisma.apontamento_producao.findMany({
        where: { data: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
        select: { venda_id: true },
        distinct: ['venda_id'],
      }),
      this.prisma.despesas.findMany({
        where: {
          data_registro: { gte: inicioMes, lte: fimMes },
          categoria: { notIn: CATEGORIAS_MATERIAIS },
        },
        select: { valor_total: true },
      }),
    ]);

    const vendaIds = new Set<number>();
    vendasComCompra.forEach((r: any) => r.venda_id && vendaIds.add(r.venda_id));
    vendasComApontamento.forEach((r: any) => r.venda_id && vendaIds.add(r.venda_id));
    const vendaIdsList = Array.from(vendaIds);
    if (!vendaIdsList.length) {
      const margemCateg = await this.getMargemPorCategoria(inicioMes, fimMes, 0, 0);
      const lucroSem = await this.getLucroPorSemana(ano, mes);
      return {
        composicao_custo: { valor_total: 0, materiais: 0, custo_hora: 0, impostos: 0, lucro_liquido: 0 },
        lucro_por_ambiente: [],
        meta_producao: { comissao_gerada: 0, meta: metaComissao ?? 0, percentual: 0 },
        previsto_vs_real: [],
        margem_por_categoria: margemCateg,
        lucro_por_semana: lucroSem,
      };
    }

    const totalDespesasFixas = despesasFixas.reduce((s, d) => s + toNum((d as any).valor_total), 0);
    const nProjetosAtivos = vendaIdsList.length;
    const rateioPorProjeto = nProjetosAtivos > 0 ? totalDespesasFixas / nProjetosAtivos : 0;

    const [vendas, itens, compras, apontamentos] = await Promise.all([
      this.prisma.vendas.findMany({
        where: { id: { in: vendaIdsList } },
        select: { id: true, valor_total: true, valor_nota_fiscal: true, valor_taxa_pagamento: true },
      }),
      this.prisma.vendas_itens.findMany({
        where: { venda_id: { in: vendaIdsList } },
        select: { venda_id: true, nome_ambiente: true, valor_total: true },
      }),
      this.prisma.compras.findMany({
        where: { venda_id: { in: vendaIdsList }, data_compra: { gte: inicioMes, lte: fimMes } },
        select: {
          venda_id: true,
          valor_total: true,
          venda_item_id: true,
          rateios: { select: { nome_ambiente: true, valor_alocado: true } },
          venda_item: { select: { nome_ambiente: true } },
        },
      }),
      this.prisma.apontamento_producao.findMany({
        where: { venda_id: { in: vendaIdsList }, data: { gte: inicioMes, lte: fimMes } },
        select: {
          venda_id: true,
          horas: true,
          custo_calculado: true,
          funcionario: { select: { custo_hora: true } },
        },
      }),
    ]);

    const vendaById = new Map<number, any>();
    vendas.forEach((v: any) => vendaById.set(v.id, v));

    const custoPorVenda = new Map<number, number>();
    apontamentos.forEach((ap: any) => {
      const vid = ap.venda_id;
      const custo = toNum((ap as any).custo_calculado) || toNum((ap as any).horas) * toNum((ap as any).funcionario?.custo_hora);
      custoPorVenda.set(vid, (custoPorVenda.get(vid) || 0) + custo);
    });

    const materiaisPorVendaAmbiente = new Map<string, number>();
    compras.forEach((c: any) => {
      const vid = c.venda_id;
      const nomeAmb = (c as any).venda_item?.nome_ambiente;
      if (nomeAmb) {
        const key = `${vid}|${nomeAmb}`;
        materiaisPorVendaAmbiente.set(key, (materiaisPorVendaAmbiente.get(key) || 0) + toNum((c as any).valor_total));
      }
      (c as any).rateios?.forEach((r: any) => {
        const key = `${vid}|${r.nome_ambiente}`;
        materiaisPorVendaAmbiente.set(key, (materiaisPorVendaAmbiente.get(key) || 0) + toNum(r.valor_alocado));
      });
    });

    let totalValor = 0;
    let totalMateriais = 0;
    let totalCustoHora = 0;
    let totalImpostos = 0;
    let totalLucro = 0;
    const lucroPorAmbiente = new Map<string, number>();
    const lucroPorVenda = new Map<number, number>();

    const valorTotalPorVenda = new Map<number, number>();
    itens.forEach((i: any) => {
      const v = valorTotalPorVenda.get(i.venda_id) || 0;
      valorTotalPorVenda.set(i.venda_id, v + toNum(i.valor_total));
    });

    itens.forEach((item: any) => {
      const vendaId = item.venda_id;
      const venda = vendaById.get(vendaId);
      const valorContrato = toNum(item.valor_total);
      const valorTotalVenda = valorTotalPorVenda.get(vendaId) || valorContrato || 1;
      const impostosVenda = toNum(venda?.valor_nota_fiscal) + toNum(venda?.valor_taxa_pagamento);
      const impostos = round2((valorContrato / valorTotalVenda) * impostosVenda);
      const materiais = round2(materiaisPorVendaAmbiente.get(`${vendaId}|${item.nome_ambiente}`) || 0);
      const custoVenda = custoPorVenda.get(vendaId) || 0;
      const custoHora = round2((valorContrato / valorTotalVenda) * custoVenda);
      const rateioDespesas = round2((valorContrato / valorTotalVenda) * rateioPorProjeto);
      const lucro = round2(valorContrato - impostos - materiais - custoHora - rateioDespesas);

      totalValor += valorContrato;
      totalMateriais += materiais;
      totalCustoHora += custoHora;
      totalImpostos += impostos;
      totalLucro += lucro;
      lucroPorVenda.set(vendaId, (lucroPorVenda.get(vendaId) || 0) + lucro);
      const amb = item.nome_ambiente || 'Outros';
      lucroPorAmbiente.set(amb, (lucroPorAmbiente.get(amb) || 0) + lucro);
    });

    const lucroPorAmbienteList = Array.from(lucroPorAmbiente.entries())
      .map(([nome_ambiente, lucro_liquido]) => ({ nome_ambiente, lucro_liquido: round2(lucro_liquido) }))
      .sort((a, b) => b.lucro_liquido - a.lucro_liquido);

    const projetosConcluidosNaMatriz = await this.prisma.agenda_fabrica.findMany({
      where: {
        venda_id: { in: vendaIdsList },
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
    const idsProjetosConcluidosNaMatriz = projetosConcluidosNaMatriz
      .map((row: any) => Number(row.projeto_id || 0))
      .filter((id) => id > 0);

    const projetosConcluidos = await this.prisma.projetos.findMany({
      where: {
        venda_id: { in: vendaIdsList },
        OR: [
          { status_atual: { in: ['MONTAGEM_FINALIZADA', 'ENCERRADO'] } },
          ...(idsProjetosConcluidosNaMatriz.length
            ? [{ id: { in: idsProjetosConcluidosNaMatriz } }]
            : []),
        ],
      },
      select: { venda_id: true },
    });
    let comissaoGerada = 0;
    projetosConcluidos.forEach((p: any) => {
      if (p.venda_id != null) {
        const lucro = lucroPorVenda.get(p.venda_id) || 0;
        if (lucro > 0) comissaoGerada += round2(lucro * 0.5);
      }
    });
    const meta = metaComissao ?? 0;
    const percentual = meta > 0 ? round2((comissaoGerada / meta) * 100) : 0;

    const previstoVsReal = await this.getPrevistoVsReal(inicioMes, fimMes, vendaIdsList);
    const margemPorCategoria = await this.getMargemPorCategoria(inicioMes, fimMes, totalValor, totalMateriais);
    const lucroPorSemana = await this.getLucroPorSemana(ano, mes);

    return {
      composicao_custo: {
        valor_total: round2(totalValor),
        materiais: round2(totalMateriais),
        custo_hora: round2(totalCustoHora),
        impostos: round2(totalImpostos),
        lucro_liquido: round2(totalLucro),
      },
      lucro_por_ambiente: lucroPorAmbienteList,
      meta_producao: { comissao_gerada: round2(comissaoGerada), meta: round2(meta), percentual },
      previsto_vs_real: previstoVsReal,
      margem_por_categoria: margemPorCategoria,
      lucro_por_semana: lucroPorSemana,
    };
  }

  /** Horas previstas (estimativa: valor_venda / custo_hora_medio) vs horas reais apontadas por projeto. */
  private async getPrevistoVsReal(
    inicioMes: Date,
    fimMes: Date,
    vendaIdsList: number[],
  ): Promise<Array<{ projeto_codigo: string; horas_previstas: number; horas_reais: number }>> {
    if (!vendaIdsList.length) return [];
    const [projetos, apontamentos, vendas, custoHoraMedio] = await Promise.all([
      this.prisma.projetos.findMany({
        where: { venda_id: { in: vendaIdsList } },
        select: { id: true, codigo: true, venda_id: true },
      }),
      this.prisma.apontamento_producao.findMany({
        where: { venda_id: { in: vendaIdsList }, data: { gte: inicioMes, lte: fimMes } },
        select: { venda_id: true, horas: true, custo_calculado: true, funcionario: { select: { custo_hora: true } } },
      }),
      this.prisma.vendas.findMany({
        where: { id: { in: vendaIdsList } },
        select: { id: true, valor_total: true },
      }),
      this.prisma.funcionarios.aggregate({
        where: { custo_hora: { not: null } },
        _avg: { custo_hora: true },
      }),
    ]);
    const mediaCustoHora = toNum((custoHoraMedio as any)?._avg?.custo_hora) || 1;
    const vendaValor = new Map<number, number>();
    vendas.forEach((v: any) => vendaValor.set(v.id, toNum(v.valor_total)));
    const horasReaisPorVenda = new Map<number, number>();
    apontamentos.forEach((ap: any) => {
      const vid = ap.venda_id;
      const h = toNum((ap as any).horas) || (toNum((ap as any).custo_calculado) / (toNum((ap as any).funcionario?.custo_hora) || 1));
      horasReaisPorVenda.set(vid, (horasReaisPorVenda.get(vid) || 0) + h);
    });
    return projetos
      .filter((p: any) => p.venda_id != null)
      .map((p: any) => {
        const valor = vendaValor.get(p.venda_id) || 0;
        const horasReais = round2(horasReaisPorVenda.get(p.venda_id) || 0);
        const horasPrevistas = mediaCustoHora > 0 ? round2(valor / mediaCustoHora) : 0;
        return {
          projeto_codigo: (p as any).codigo,
          horas_previstas: horasPrevistas,
          horas_reais: horasReais,
        };
      })
      .filter((r) => r.horas_previstas > 0 || r.horas_reais > 0)
      .slice(0, 15);
  }

  /** Custo/margem por tipo de compra (categoria material/acabamento). Margem = receita alocada proporcional - custo. */
  private async getMargemPorCategoria(
    inicioMes: Date,
    fimMes: Date,
    receitaTotalMes: number,
    custoTotalMateriaisMes: number,
  ): Promise<Array<{ categoria: string; custo_total: number; margem_contribuicao: number }>> {
    const compras = await this.prisma.compras.findMany({
      where: { data_compra: { gte: inicioMes, lte: fimMes }, venda_id: { not: null } },
      select: { tipo_compra: true, valor_total: true },
    });
    const porCategoria = new Map<string, number>();
    compras.forEach((c: any) => {
      const cat = (c as any).tipo_compra || 'Outros';
      porCategoria.set(cat, (porCategoria.get(cat) || 0) + toNum((c as any).valor_total));
    });
    const totalCusto = custoTotalMateriaisMes || 1;
    return Array.from(porCategoria.entries())
      .map(([categoria, custo_total]) => {
        const receitaAlocada = custoTotalMateriaisMes > 0 ? (custo_total / totalCusto) * receitaTotalMes : 0;
        const margem_contribuicao = round2(receitaAlocada - custo_total);
        return { categoria, custo_total: round2(custo_total), margem_contribuicao };
      })
      .sort((a, b) => Math.abs(b.margem_contribuicao) - Math.abs(a.margem_contribuicao))
      .slice(0, 10);
  }

  /** Lucro líquido semana a semana no mês (competência). */
  private async getLucroPorSemana(ano: number, mes: number): Promise<Array<{ semana: number; label: string; lucro_liquido: number }>> {
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const semanas: Array<{ inicio: Date; fim: Date; num: number }> = [];
    for (let d = 1; d <= diasNoMes; d += 7) {
      const fimD = Math.min(d + 6, diasNoMes);
      semanas.push({
        inicio: new Date(ano, mes - 1, d, 0, 0, 0),
        fim: new Date(ano, mes - 1, fimD, 23, 59, 59),
        num: semanas.length + 1,
      });
    }
    const result: Array<{ semana: number; label: string; lucro_liquido: number }> = [];
    for (const sem of semanas) {
      const [vendasCompra, vendasApont] = await Promise.all([
        this.prisma.compras.findMany({
          where: { data_compra: { gte: sem.inicio, lte: sem.fim }, venda_id: { not: null } },
          select: { venda_id: true },
          distinct: ['venda_id'],
        }),
        this.prisma.apontamento_producao.findMany({
          where: { data: { gte: sem.inicio, lte: sem.fim }, venda_id: { not: null } },
          select: { venda_id: true },
          distinct: ['venda_id'],
        }),
      ]);
      const vendaIds = new Set<number>();
      vendasCompra.forEach((r: any) => r.venda_id && vendaIds.add(r.venda_id));
      vendasApont.forEach((r: any) => r.venda_id && vendaIds.add(r.venda_id));
      const list = Array.from(vendaIds);
      if (!list.length) {
        result.push({ semana: sem.num, label: `Sem ${sem.num}`, lucro_liquido: 0 });
        continue;
      }
      const [vendas, itens, comprasSem, apontSem, despesasFixas] = await Promise.all([
        this.prisma.vendas.findMany({
          where: { id: { in: list } },
          select: { id: true, valor_total: true, valor_nota_fiscal: true, valor_taxa_pagamento: true },
        }),
        this.prisma.vendas_itens.findMany({
          where: { venda_id: { in: list } },
          select: { venda_id: true, nome_ambiente: true, valor_total: true },
        }),
        this.prisma.compras.findMany({
          where: { venda_id: { in: list }, data_compra: { gte: sem.inicio, lte: sem.fim } },
          select: {
            venda_id: true,
            valor_total: true,
            venda_item_id: true,
            rateios: { select: { nome_ambiente: true, valor_alocado: true } },
            venda_item: { select: { nome_ambiente: true } },
          },
        }),
        this.prisma.apontamento_producao.findMany({
          where: { venda_id: { in: list }, data: { gte: sem.inicio, lte: sem.fim } },
          select: {
            venda_id: true,
            horas: true,
            custo_calculado: true,
            funcionario: { select: { custo_hora: true } },
          },
        }),
        this.prisma.despesas.findMany({
          where: {
            data_registro: { gte: sem.inicio, lte: sem.fim },
            categoria: { notIn: CATEGORIAS_MATERIAIS },
          },
          select: { valor_total: true },
        }),
      ]);
      const nAtivos = list.length;
      const totalFixas = (despesasFixas as any[]).reduce((s, d) => s + toNum(d.valor_total), 0);
      const rateioProjeto = nAtivos > 0 ? totalFixas / nAtivos : 0;
      const vendaById = new Map<number, any>();
      (vendas as any[]).forEach((v) => vendaById.set(v.id, v));
      const valorTotalPorVenda = new Map<number, number>();
      (itens as any[]).forEach((i) => valorTotalPorVenda.set(i.venda_id, (valorTotalPorVenda.get(i.venda_id) || 0) + toNum(i.valor_total)));
      const custoPorVenda = new Map<number, number>();
      (apontSem as any[]).forEach((ap) => {
        const vid = ap.venda_id;
        const c = toNum(ap.custo_calculado) || toNum(ap.horas) * toNum(ap.funcionario?.custo_hora);
        custoPorVenda.set(vid, (custoPorVenda.get(vid) || 0) + c);
      });
      const matPorVendaAmb = new Map<string, number>();
      (comprasSem as any[]).forEach((c) => {
        const vid = c.venda_id;
        const amb = c.venda_item?.nome_ambiente;
        if (amb) matPorVendaAmb.set(`${vid}|${amb}`, (matPorVendaAmb.get(`${vid}|${amb}`) || 0) + toNum(c.valor_total));
        c.rateios?.forEach((r) => matPorVendaAmb.set(`${vid}|${r.nome_ambiente}`, (matPorVendaAmb.get(`${vid}|${r.nome_ambiente}`) || 0) + toNum(r.valor_alocado)));
      });
      let lucroSem = 0;
      (itens as any[]).forEach((item) => {
        const vendaId = item.venda_id;
        const venda = vendaById.get(vendaId);
        const valorContrato = toNum(item.valor_total);
        const valorTotalVenda = valorTotalPorVenda.get(vendaId) || valorContrato || 1;
        const impostosVenda = toNum(venda?.valor_nota_fiscal) + toNum(venda?.valor_taxa_pagamento);
        const impostos = round2((valorContrato / valorTotalVenda) * impostosVenda);
        const materiais = round2(matPorVendaAmb.get(`${vendaId}|${item.nome_ambiente}`) || 0);
        const custoVenda = custoPorVenda.get(vendaId) || 0;
        const custoHora = round2((valorContrato / valorTotalVenda) * custoVenda);
        const rateio = round2((valorContrato / valorTotalVenda) * rateioProjeto);
        lucroSem += round2(valorContrato - impostos - materiais - custoHora - rateio);
      });
      result.push({ semana: sem.num, label: `Sem ${sem.num}`, lucro_liquido: round2(lucroSem) });
    }
    return result;
  }
}
