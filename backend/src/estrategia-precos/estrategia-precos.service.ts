import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriceStrategyFiltersDto } from './dto/price-strategy-filters.dto';
import {
  FUNCIONARIOS_BASE_CALCULO,
  FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS,
} from '../../shared/constantes/funcionarios-custos';

const GLOBAL_CONFIG_KEY = 'PRICING_SEARCH_STRATEGY';
type SearchStrategy = 'MIN_PRICE' | 'AVG_PRICE' | 'MAX_PRICE';

type ProdutoComPreco = {
  id: number;
  nome_produto: string;
  categoria: string | null;
  categoria_base?: string | null;
  marca: string | null;
  espessura_mm: number | null;
  valor_unitario: any;
  preco_m2: any;
};

type OperationalMaterialLink = {
  category?: string;
  thickness?: number;
  group?: string;
  color?: string;
  commercial_category?: string;
  acrescimo_pct?: number;
  min_purchase_price?: number;
  avg_purchase_price?: number;
  max_purchase_price?: number;
  reference_purchase_price?: number;
  area_m2?: number;
  selected?: boolean;
};

type OperationalKitItem = {
  id?: number;
  name?: string;
  categoria_base?: string;
  value?: number;
  selected?: boolean;
};

type ProcessOperationalMatrixPayload = {
  area_chapa_m2?: number;
  loss_margin_pct?: number;
  markup_base_pct?: number;
  material_links?: OperationalMaterialLink[];
  kit_items?: OperationalKitItem[];
  hora_homem_value?: number;
  custo_fixo_fabrica_value?: number;
  capacidade_m2_mes?: number;
  fix_insumo_per_m2?: number;
};

@Injectable()
export class EstrategiaPrecosService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly CUSTO_FIXO_CATEGORIAS = [
    'AGUA',
    'ENERGIA',
    'INTERNET',
    'SEGURANCA',
    'LIMPEZA',
    'DEPRECIACAO_MAQUINAS',
    'SEGURO_MAQUINAS',
    'ALUGUEL',
  ];

  /** Keywords que identificam despesas de pro-labore/diretoria → sempre Administrativo */
  private readonly PRO_LABORE_KEYWORDS = ['PRO_LABORE', 'PRO LABORE'] as const;

  private get globalConfigTable(): any {
    return (this.prisma as any).globalConfig;
  }

  private toPrice(produto: ProdutoComPreco): number {
    const asNumber = Number(produto?.valor_unitario ?? produto?.preco_m2 ?? 0);
    return Number.isFinite(asNumber) ? asNumber : 0;
  }

  private parseEspessura(value?: string): number | null {
    const cleaned = String(value ?? '').replace(/\D/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeFinanceText(value?: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private round4(value: number): number {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
  }

  private buildWhere(filters?: PriceStrategyFiltersDto): any {
    const categoria = String(filters?.categoria ?? '').trim();
    const grupo = String(filters?.grupo ?? '').trim();
    const espessura = this.parseEspessura(filters?.espessura);

    return {
      status: 'ATIVO',
      ...(categoria
        ? {
            categoria: {
              contains: categoria,
            },
          }
        : {}),
      ...(grupo
        ? {
            marca: {
              contains: grupo,
            },
          }
        : {}),
      ...(espessura ? { espessura_mm: espessura } : {}),
    };
  }

  private pickProdutoByStrategy(
    strategy: SearchStrategy,
    produtos: ProdutoComPreco[],
  ): ProdutoComPreco | null {
    if (!produtos.length) return null;

    const ordered = [...produtos].sort((a, b) => this.toPrice(a) - this.toPrice(b));

    if (strategy === 'MIN_PRICE') return ordered[0];
    if (strategy === 'MAX_PRICE') return ordered[ordered.length - 1];

    const avg =
      ordered.reduce((acc, item) => acc + this.toPrice(item), 0) / ordered.length;

    return ordered.reduce((closest, current) => {
      const currentDelta = Math.abs(this.toPrice(current) - avg);
      const closestDelta = Math.abs(this.toPrice(closest) - avg);
      return currentDelta < closestDelta ? current : closest;
    }, ordered[0]);
  }

  private computeCurrentValue(strategy: SearchStrategy, prices: number[]): number {
    if (!prices.length) return 0;

    if (strategy === 'MIN_PRICE') return Math.min(...prices);
    if (strategy === 'MAX_PRICE') return Math.max(...prices);

    return prices.reduce((acc, current) => acc + current, 0) / prices.length;
  }

  async getConfig() {
    return this.globalConfigTable.upsert({
      where: { key: GLOBAL_CONFIG_KEY },
      update: {},
      create: {
        key: GLOBAL_CONFIG_KEY,
        search_strategy: 'AVG_PRICE',
      },
    });
  }

  async updateStrategy(strategy: SearchStrategy) {
    return this.globalConfigTable.upsert({
      where: { key: GLOBAL_CONFIG_KEY },
      update: { search_strategy: strategy },
      create: {
        key: GLOBAL_CONFIG_KEY,
        search_strategy: strategy,
      },
    });
  }

  async buscarProdutoReferencia(filters?: PriceStrategyFiltersDto) {
    const config = await this.getConfig();
    const where = this.buildWhere(filters);

    const produtos = await (this.prisma as any).produtos.findMany({
      where,
      select: {
        id: true,
        nome_produto: true,
        categoria: true,
        marca: true,
        espessura_mm: true,
        valor_unitario: true,
        preco_m2: true,
      },
    });

    const escolhido = this.pickProdutoByStrategy(config.search_strategy, produtos as ProdutoComPreco[]);

    return {
      strategy: config.search_strategy,
      filters: {
        categoria: filters?.categoria ?? null,
        espessura: this.parseEspessura(filters?.espessura),
        grupo: filters?.grupo ?? null,
      },
      total: produtos.length,
      produto: escolhido
        ? {
            ...escolhido,
            valor_considerado: this.toPrice(escolhido),
          }
        : null,
    };
  }

  async listarTopMateriais(filters?: PriceStrategyFiltersDto) {
    const config = await this.getConfig();
    const where = this.buildWhere(filters);

    const produtos = (await this.prisma.produtos.findMany({
      where,
      select: {
        id: true,
        nome_produto: true,
        categoria: true,
        marca: true,
        espessura_mm: true,
        valor_unitario: true,
        preco_m2: true,
        quantidade: true,
      },
      orderBy: [{ quantidade: 'desc' }, { nome_produto: 'asc' }],
    })) as Array<ProdutoComPreco & { quantidade: number | null }>;

    const groups = new Map<string, Array<ProdutoComPreco & { quantidade: number | null }>>();

    for (const produto of produtos) {
      const key = [
        String(produto.nome_produto || '').trim().toUpperCase(),
        Number(produto.espessura_mm ?? 0),
      ].join('__');

      const existing = groups.get(key) || [];
      existing.push(produto);
      groups.set(key, existing);
    }

    const materiais = Array.from(groups.values())
      .map((items) => {
        const prices = items.map((item) => this.toPrice(item)).filter((p) => p > 0);
        const byMin = [...items].sort((a, b) => this.toPrice(a) - this.toPrice(b));
        const byMax = [...byMin].reverse();

        const minItem = byMin[0] ?? null;
        const maxItem = byMax[0] ?? null;
        const avgValue = this.computeCurrentValue('AVG_PRICE', prices);

        const selectedItem = this.pickProdutoByStrategy(config.search_strategy, items);

        return {
          material: items[0]?.nome_produto ?? 'Material',
          categoria: items[0]?.categoria ?? null,
          grupo: items[0]?.marca ?? null,
          espessura_mm: items[0]?.espessura_mm ?? null,
          total_variacoes: items.length,
          min_price: minItem ? this.toPrice(minItem) : 0,
          avg_price: avgValue,
          max_price: maxItem ? this.toPrice(maxItem) : 0,
          valor_considerado: this.computeCurrentValue(config.search_strategy, prices),
          produto_referencia_id: selectedItem?.id ?? null,
        };
      })
      .sort((a, b) => {
        if (b.total_variacoes !== a.total_variacoes) {
          return b.total_variacoes - a.total_variacoes;
        }
        return String(a.material).localeCompare(String(b.material));
      })
      .slice(0, 5);

    return {
      strategy: config.search_strategy,
      filters: {
        categoria: filters?.categoria ?? null,
        espessura: this.parseEspessura(filters?.espessura),
        grupo: filters?.grupo ?? null,
      },
      totalFiltrado: produtos.length,
      materiais,
    };
  }

  // ─── MATRIZ OPERACIONAL ───────────────────────────────────────────────────

  /** Área padrão da chapa de MDF (2750mm × 1840mm) em m² */
  private readonly AREA_CHAPA_M2 = 5.06;
  /** Margem de perda operacional padrão (20%) */
  private readonly LOSS_MARGIN = 0.2;
  /** Markup base padrão (100% = dobrar custo da chapa) */
  private readonly MARKUP_BASE_PCT = 100;
  private readonly COMMERCIAL_CATEGORIES = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'] as const;

  private normalizeCommercialCategory(value?: string): 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA' {
    const text = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();

    if (text.includes('SECUND')) return 'SECUNDARIA';
    if (text.includes('TERCI')) return 'TERCIARIA';
    return 'PRIMARIA';
  }

  private normalizeColor(value?: string): string {
    return String(value || '').trim().toUpperCase();
  }

  private applyMatrixCalc(valorBase: number): number {
    // Fórmula operacional fixa solicitada:
    // ((Valor * 2) / 5.06) * 1.20
    return ((valorBase * 2) / this.AREA_CHAPA_M2) * (1 + this.LOSS_MARGIN);
  }

  private buildGruposMdfFromProdutos(
    produtos: Array<{
      categoria: string | null;
      categoria_base?: string | null;
      espessura_mm: number | null;
      nome_produto: string | null;
      cor?: string | null;
      marca?: string | null;
      valor_unitario: any;
    }>,
    strategy: SearchStrategy = 'AVG_PRICE',
  ) {
    const groups = new Map<
      string,
      {
        category: string;
        thickness: number;
        group: string;
        color: string;
        commercial_category: string;
        prices: number[];
      }
    >();

    for (const p of produtos) {
      const category = String(p.categoria || '').trim();
      const thickness = Number(p.espessura_mm ?? 0);
      const colorRaw = String(p.cor || p.nome_produto || '').trim();
      const group = colorRaw;
      const commercialCategory = this.normalizeCommercialCategory(
        p.categoria_base || p.marca || p.categoria || p.nome_produto || '',
      );

      if (!category || !thickness || !group) continue;

      const key = `${category}__${thickness}__${group}__${commercialCategory}`;
      const price = Number(p.valor_unitario ?? 0);
      const entry = groups.get(key) ?? {
        category,
        thickness,
        group,
        color: colorRaw,
        commercial_category: commercialCategory,
        prices: [],
      };
      if (price > 0) entry.prices.push(price);
      groups.set(key, entry);
    }

    return Array.from(groups.values()).map((entry) => {
      const min = entry.prices.length ? Math.min(...entry.prices) : 0;
      const max = entry.prices.length ? Math.max(...entry.prices) : 0;
      const avg =
        entry.prices.length > 0
          ? entry.prices.reduce((sum, p) => sum + p, 0) / entry.prices.length
          : 0;

      const reference =
        strategy === 'MIN_PRICE' ? min : strategy === 'MAX_PRICE' ? max : avg;

      return {
        category: entry.category,
        thickness: entry.thickness,
        group: entry.group,
        color: entry.color,
        commercial_category: entry.commercial_category,
        min_purchase_price: min,
        avg_purchase_price: avg,
        max_purchase_price: max,
        reference_purchase_price: reference,
      };
    });
  }

  async listarGruposMdf() {
    const produtos = await (this.prisma as any).produtos.findMany({
      where: {
        status: 'ATIVO',
        OR: [
          {
            categoria_base: {
              in: [...this.COMMERCIAL_CATEGORIES],
            },
          },
          {
            AND: [
              {
                OR: [{ categoria_base: null }, { categoria_base: '' }],
              },
              {
                tipo_aplicacao: {
                  in: ['MDF', 'MATERIA_PRIMA'],
                },
              },
            ],
          },
        ],
      },
      select: {
        categoria: true,
        categoria_base: true,
        espessura_mm: true,
        nome_produto: true,
        cor: true,
        marca: true,
        valor_unitario: true,
      },
      orderBy: [{ categoria: 'asc' }, { espessura_mm: 'asc' }, { nome_produto: 'asc' }],
    });

    return this.buildGruposMdfFromProdutos(produtos, 'AVG_PRICE');
  }

  async buscarReferenciasMdfPorTermo(termo: string, strategy: SearchStrategy = 'AVG_PRICE') {
    const texto = String(termo || '').trim();
    if (!texto) return [];

    const useStrategy: SearchStrategy =
      strategy === 'MIN_PRICE' || strategy === 'MAX_PRICE' || strategy === 'AVG_PRICE'
        ? strategy
        : 'AVG_PRICE';

    const produtos = await (this.prisma as any).produtos.findMany({
      where: {
        status: 'ATIVO',
        OR: [
          {
            categoria_base: {
              in: [...this.COMMERCIAL_CATEGORIES],
            },
          },
          {
            AND: [
              {
                OR: [{ categoria_base: null }, { categoria_base: '' }],
              },
              {
                tipo_aplicacao: {
                  in: ['MDF', 'MATERIA_PRIMA'],
                },
              },
            ],
          },
        ],
        nome_produto: {
          contains: texto,
        },
      },
      select: {
        categoria: true,
        categoria_base: true,
        espessura_mm: true,
        nome_produto: true,
        cor: true,
        marca: true,
        valor_unitario: true,
      },
      orderBy: [{ categoria: 'asc' }, { espessura_mm: 'asc' }, { nome_produto: 'asc' }],
      take: 200,
    });

    return this.buildGruposMdfFromProdutos(produtos, useStrategy);
  }

  async buscarMdfPorCategoriaComercial(
    categoriaComercial: string,
    strategy: SearchStrategy = 'AVG_PRICE',
  ) {
    const normalized = this.normalizeCommercialCategory(categoriaComercial);
    const useStrategy: SearchStrategy =
      strategy === 'MIN_PRICE' || strategy === 'MAX_PRICE' || strategy === 'AVG_PRICE'
        ? strategy
        : 'AVG_PRICE';

    const produtos = await (this.prisma as any).produtos.findMany({
      where: {
        status: 'ATIVO',
        OR: [
          {
            categoria_base: {
              in: [...this.COMMERCIAL_CATEGORIES],
            },
          },
          {
            AND: [
              {
                OR: [{ categoria_base: null }, { categoria_base: '' }],
              },
              {
                tipo_aplicacao: {
                  in: ['MDF', 'MATERIA_PRIMA'],
                },
              },
            ],
          },
        ],
      },
      select: {
        categoria: true,
        categoria_base: true,
        espessura_mm: true,
        nome_produto: true,
        cor: true,
        marca: true,
        valor_unitario: true,
      },
      orderBy: [{ categoria: 'asc' }, { espessura_mm: 'asc' }, { nome_produto: 'asc' }],
    });

    const filtered = produtos.filter(
      (p) =>
        this.normalizeCommercialCategory(
          p.categoria_base || p.marca || p.categoria || p.nome_produto || '',
        ) === normalized,
    );

    return this.buildGruposMdfFromProdutos(filtered, useStrategy);
  }

  async listarInsumosFixos() {
    const produtos = await (this.prisma as any).produtos.findMany({
      where: {
        status: 'ATIVO',
        OR: [
          { categoria_base: 'INSUMO' },
          {
            AND: [
              {
                OR: [{ categoria_base: null }, { categoria_base: '' }],
              },
              { tipo_aplicacao: 'INSUMO' },
            ],
          },
        ],
      },
      select: {
        id: true,
        nome_produto: true,
        unidade: true,
        categoria: true,
        categoria_base: true,
        valor_unitario: true,
      },
      orderBy: [{ nome_produto: 'asc' }],
    });

    return produtos.map((item: any) => ({
      id: item.id,
      name: item.nome_produto,
      unidade: item.unidade,
      categoria: item.categoria,
      categoria_base: item.categoria_base,
      value: Number(item.valor_unitario ?? 0),
      selected: true,
    }));
  }

  async calcularCustosInternosPorDespesas(params?: {
    mes?: number;
    ano?: number;
    capacidade_m2_mes?: number;
  }) {
    const now = new Date();
    const mes =
      Number.isFinite(Number(params?.mes)) && Number(params?.mes) >= 1 && Number(params?.mes) <= 12
        ? Number(params?.mes)
        : now.getMonth() + 1;
    const ano =
      Number.isFinite(Number(params?.ano)) && Number(params?.ano) >= 2000
        ? Number(params?.ano)
        : now.getFullYear();

    const capacidadeM2Mes = Number(params?.capacidade_m2_mes ?? 0);
    const capacidadeFinal =
      capacidadeM2Mes > 0
        ? capacidadeM2Mes
        : FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_m2.divisor_padrao;

    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const despesas = await this.prisma.despesas.findMany({
      where: {
        tipo_movimento: 'SAIDA',
        data_vencimento: { gte: inicioMes, lte: fimMes },
      },
      select: {
        categoria: true,
        classificacao: true,
        local: true,
        unidade: true,
        valor_total: true,
        funcionario_id: true,
      },
    });

    const keywordsFuncionario = [...FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS];
    const custosFixosSet = new Set(this.CUSTO_FIXO_CATEGORIAS);

    // Pessoal de Fábrica (produção) → denominador: capacidade_m2_mes
    let totalFabrica = 0;
    // Pessoal Administrativo/Pro-labore → denominador: horas_uteis_mes (176h)
    let totalAdministrativo = 0;
    // Custos fixos operacionais (luz, aluguel, etc.) — nunca soma pessoal
    let operacaoTotal = 0;

    for (const despesa of despesas) {
      const camposTexto = FUNCIONARIOS_BASE_CALCULO.campos_texto.map((campo) =>
        this.normalizeFinanceText((despesa as any)?.[campo] || ''),
      );
      const categoria = camposTexto[0] || '';
      const classificacao = camposTexto[1] || '';
      const valor = Number(despesa.valor_total ?? 0);

      if (!Number.isFinite(valor) || valor <= 0) continue;

      const textoCompleto = camposTexto.join(' ');
      const isFuncionarioPorTexto = keywordsFuncionario.some((k) => textoCompleto.includes(k));
      const isFuncionarioPorVinculo =
        Number.isFinite(Number(despesa.funcionario_id)) && Number(despesa.funcionario_id) > 0;

      if (isFuncionarioPorTexto || isFuncionarioPorVinculo) {
        // Isolamento garantido: pessoal nunca entra em isCustoFixo
        const normalizedUnidade = this.normalizeFinanceText((despesa as any).unidade || '');
        const isProLabore = this.PRO_LABORE_KEYWORDS.some((k) => textoCompleto.includes(k));
        const isProducaoFabrica = normalizedUnidade.includes('FABRICA') && !isProLabore;

        if (isProducaoFabrica) {
          totalFabrica += valor;
        } else {
          totalAdministrativo += valor;
        }
        continue;
      }

      const isCustoFixo =
        classificacao.includes('CUSTO_FIXO') ||
        classificacao.includes('CUSTOS_FIXOS') ||
        classificacao.includes('CUSTO FIXO') ||
        classificacao.includes('CUSTOS FIXOS') ||
        categoria.includes('CUSTO_FIXO') ||
        categoria.includes('CUSTOS_FIXOS') ||
        categoria.includes('CUSTO FIXO') ||
        categoria.includes('CUSTOS FIXOS') ||
        custosFixosSet.has(categoria);

      if (isCustoFixo) {
        operacaoTotal += valor;
      }
    }

    const horasUtilesMes = FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_hora.divisor_padrao;
    const maoDeObraTotal = totalFabrica + totalAdministrativo;
    // HORA-HOMEM (Aba 3): somente pessoal de Fábrica / capacidade m²
    const horaHomemValue = this.round4(totalFabrica / capacidadeFinal);
    // Custo hora administrativo: pessoal não-produção / 176h
    const custoHoraAdministrativo = this.round4(totalAdministrativo / horasUtilesMes);
    const custoFixoFabricaValue = this.round4(operacaoTotal / capacidadeFinal);

    return {
      mes,
      ano,
      capacidade_m2_mes: capacidadeFinal,
      mao_de_obra_total: this.round4(maoDeObraTotal),
      mao_de_obra_fabrica: this.round4(totalFabrica),
      mao_de_obra_administrativo: this.round4(totalAdministrativo),
      custo_hora_administrativo: custoHoraAdministrativo,
      operacao_total: this.round4(operacaoTotal),
      hora_homem_value: horaHomemValue,
      custo_fixo_fabrica_value: custoFixoFabricaValue,
      custos_internos_total: this.round4(horaHomemValue + custoFixoFabricaValue),
    };
  }

  // ─── MOTOR DE RH ────────────────────────────────────────────────────────────

  /**
   * Motor de RH: percorre despesas do mês e distribui custos de pessoal entre
   * Produção/Fábrica e Administrativo usando divisores distintos.
   *
   *  - custoM2Producao        → alimenta HORA-HOMEM na Aba 3 da Matriz Operacional
   *  - custoHoraAdministrativo → custo operacional administrativo (financeiro geral)
   *
   * Divisores (de FUNCIONARIOS_BASE_CALCULO):
   *  - Fábrica:        capacidade_m2_mes
   *  - Administrativo: horas_uteis_mes_fabrica (padrão 176h)
   */
  async getCalculoCustosRH(params?: {
    mes?: number;
    ano?: number;
    capacidade_m2_mes?: number;
    horas_uteis_mes?: number;
  }) {
    const now = new Date();
    const mes =
      Number.isFinite(Number(params?.mes)) && Number(params?.mes) >= 1 && Number(params?.mes) <= 12
        ? Number(params?.mes)
        : now.getMonth() + 1;
    const ano =
      Number.isFinite(Number(params?.ano)) && Number(params?.ano) >= 2000
        ? Number(params?.ano)
        : now.getFullYear();

    const capacidadeM2Mes =
      Number(params?.capacidade_m2_mes ?? 0) > 0
        ? Number(params!.capacidade_m2_mes)
        : FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_m2.divisor_padrao;
    const horasUtilesMes =
      Number(params?.horas_uteis_mes ?? 0) > 0
        ? Number(params!.horas_uteis_mes)
        : FUNCIONARIOS_BASE_CALCULO.custo_hora_empresarial_por_hora.divisor_padrao;

    const inicioMes = new Date(ano, mes - 1, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);

    const despesas = await this.prisma.despesas.findMany({
      where: {
        tipo_movimento: 'SAIDA',
        data_vencimento: { gte: inicioMes, lte: fimMes },
      },
      select: {
        categoria: true,
        classificacao: true,
        local: true,
        unidade: true,
        valor_total: true,
        funcionario_id: true,
      },
    });

    const keywordsFuncionario = [...FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS];
    let totalFabrica = 0;
    let totalAdministrativo = 0;

    for (const despesa of despesas) {
      const camposTexto = FUNCIONARIOS_BASE_CALCULO.campos_texto.map((campo) =>
        this.normalizeFinanceText((despesa as any)?.[campo] || ''),
      );
      const valor = Number(despesa.valor_total ?? 0);
      if (!Number.isFinite(valor) || valor <= 0) continue;

      const textoCompleto = camposTexto.join(' ');
      const isFuncionarioPorTexto = keywordsFuncionario.some((k) => textoCompleto.includes(k));
      const isFuncionarioPorVinculo =
        Number.isFinite(Number(despesa.funcionario_id)) && Number(despesa.funcionario_id) > 0;

      if (!isFuncionarioPorTexto && !isFuncionarioPorVinculo) continue;

      const normalizedUnidade = this.normalizeFinanceText((despesa as any).unidade || '');
      const isProLabore = this.PRO_LABORE_KEYWORDS.some((k) => textoCompleto.includes(k));
      const isProducaoFabrica = normalizedUnidade.includes('FABRICA') && !isProLabore;

      if (isProducaoFabrica) {
        totalFabrica += valor;
      } else {
        totalAdministrativo += valor;
      }
    }

    const custoM2Producao = this.round4(totalFabrica / capacidadeM2Mes);
    const custoHoraAdministrativo = this.round4(totalAdministrativo / horasUtilesMes);
    const totalFolhaMensal = this.round4(totalFabrica + totalAdministrativo);

    return {
      mes,
      ano,
      capacidade_m2_mes: capacidadeM2Mes,
      horas_uteis_mes: horasUtilesMes,
      totalFabrica: this.round4(totalFabrica),
      totalAdministrativo: this.round4(totalAdministrativo),
      totalFolhaMensal,
      custoM2Producao,          // → HORA-HOMEM (Aba 3, divisor: capacidade_m2_mes)
      custoHoraAdministrativo,  // → custo operacional administrativo (divisor: 176h)
    };
  }

  /**
   * Recalcula automaticamente os valores de Hora-Homem na OperationalMatrix
   * quando uma despesa de pessoal é criada, alterada ou removida no módulo de Despesas.
   *
   * Lê o cache de componentes (kit + custoFixo) persistido pelo último
   * processOperationalMatrix para não sobrescrever os demais componentes do CMV.
   */
  async recalcularCMVPorFuncionarios(params?: {
    mes?: number;
    ano?: number;
    capacidade_m2_mes?: number;
  }) {
    const rh = await this.getCalculoCustosRH(params);

    // Cache de componentes salvo em processOperationalMatrix (row especial)
    const cacheRow: any = await (this.prisma as any).operationalMatrix.findUnique({
      where: {
        category_thickness_group: {
          category: '_RH_CACHE_',
          thickness: -1,
          group: '_CACHE_',
        },
      },
    });

    const kitValue = cacheRow ? Number(cacheRow.max_cost_base ?? 0) : 0;
    const custoFixoValue = cacheRow ? Number(cacheRow.avg_cost_base ?? 0) : 0;
    const newFixInsumo = this.round4(kitValue + rh.custoM2Producao + custoFixoValue);

    // Atualiza todos os registros reais da matrix com o novo fix_insumo_value
    await (this.prisma as any).operationalMatrix.updateMany({
      where: { NOT: { category: '_RH_CACHE_' } },
      data: { fix_insumo_value: newFixInsumo },
    });

    // Mantém o campo hora-homem do cache atualizado
    if (cacheRow) {
      await (this.prisma as any).operationalMatrix.update({
        where: { id: cacheRow.id },
        data: { min_cost_base: rh.custoM2Producao },
      });
    }

    return {
      ...rh,
      kit_value: kitValue,
      custo_fixo_value: custoFixoValue,
      novo_fix_insumo_value: newFixInsumo,
    };
  }

  /**
   * Processa os MDFs selecionados e gera 1 linha por categoria comercial
   * (PRIMARIA/SECUNDARIA/TERCIARIA) com min/medio/max pela fórmula fixa.
   */
  async processOperationalMatrix(payload: ProcessOperationalMatrixPayload): Promise<{
    processed: number;
    items: any[];
  }> {
    const materialLinks = Array.isArray(payload?.material_links) ? payload.material_links : [];
    const kitValue = (Array.isArray(payload?.kit_items) ? payload.kit_items : [])
      .filter((item) => item?.selected !== false)
      .reduce((acc, item) => acc + Number(item?.value ?? 0), 0);

    const custosInternosAuto =
      payload?.hora_homem_value == null || payload?.custo_fixo_fabrica_value == null
        ? await this.calcularCustosInternosPorDespesas({
            capacidade_m2_mes: Number(payload?.capacidade_m2_mes ?? 1),
          })
        : null;

    const horaHomemValue = Number(
      payload?.hora_homem_value ?? custosInternosAuto?.hora_homem_value ?? 0,
    );
    const custoFixoFabricaValue = Number(
      payload?.custo_fixo_fabrica_value ?? custosInternosAuto?.custo_fixo_fabrica_value ?? 0,
    );
    const fixInsumoValue = kitValue + horaHomemValue + custoFixoFabricaValue;
    const selectedLinks = materialLinks.filter((link) => link?.selected !== false);

    const grouped = new Map<string, { prices: number[]; thicknesses: Set<number> }>();

    for (const link of selectedLinks) {
      const category = this.normalizeCommercialCategory(
        link?.commercial_category || link?.category || link?.group || '',
      );

      const basePrice = Number(
        link?.reference_purchase_price ??
          link?.avg_purchase_price ??
          link?.min_purchase_price ??
          link?.max_purchase_price ??
          0,
      );
      const acrescimoPct = Number(link?.acrescimo_pct ?? 0);
      const price = basePrice * (1 + acrescimoPct / 100);
      if (!price || !Number.isFinite(price)) continue;

      const thickness = Number(link?.thickness ?? 0);
      const current = grouped.get(category) ?? { prices: [], thicknesses: new Set<number>() };
      current.prices.push(price);
      if (thickness > 0) current.thicknesses.add(thickness);
      grouped.set(category, current);
    }

    const results: any[] = [];

    for (const [category, data] of grouped.entries()) {
      const prices = data.prices.filter((p) => Number.isFinite(p) && p > 0);
      if (!prices.length) continue;

      const minPrice = Math.min(...prices);
      const avgPrice = prices.reduce((sum, value) => sum + value, 0) / prices.length;
      const maxPrice = Math.max(...prices);

      const savePayload = {
        min_cost_base: this.applyMatrixCalc(minPrice),
        avg_cost_base: this.applyMatrixCalc(avgPrice),
        max_cost_base: this.applyMatrixCalc(maxPrice),
        fix_insumo_value: fixInsumoValue,
        mdf_extra_pct: Number(
          selectedLinks.find(
            (link) =>
              this.normalizeCommercialCategory(
                link?.commercial_category || link?.category || link?.group || '',
              ) === category,
          )?.acrescimo_pct ?? 0,
        ),
      };

      const record = await (this.prisma as any).operationalMatrix.upsert({
        where: {
          category_thickness_group: {
            category,
            thickness: 0,
            group: 'AGRUPADO',
          },
        },
        update: savePayload,
        create: {
          category,
          thickness: 0,
          group: 'AGRUPADO',
          ...savePayload,
        },
      });

      results.push({
        ...record,
        thickness_label: Array.from(data.thicknesses)
          .sort((a, b) => a - b)
          .map((t) => `${t} mm`)
          .join(', ') || 'Consolidado',
      });
    }

    // Persiste o breakdown de componentes (kit, hora-homem, custo-fixo)
    // para que recalcularCMVPorFuncionarios possa atualizar apenas a hora-homem
    // sem perder os valores de kit e custo fixo salvos nesta sessão.
    await (this.prisma as any).operationalMatrix.upsert({
      where: {
        category_thickness_group: {
          category: '_RH_CACHE_',
          thickness: -1,
          group: '_CACHE_',
        },
      },
      update: {
        min_cost_base: horaHomemValue,        // campo hora-homem
        avg_cost_base: custoFixoFabricaValue, // campo custo fixo fábrica
        max_cost_base: kitValue,              // campo kit/insumos
        fix_insumo_value: 0,
        mdf_extra_pct: 0,
      },
      create: {
        category: '_RH_CACHE_',
        thickness: -1,
        group: '_CACHE_',
        min_cost_base: horaHomemValue,
        avg_cost_base: custoFixoFabricaValue,
        max_cost_base: kitValue,
        fix_insumo_value: 0,
        mdf_extra_pct: 0,
      },
    });

    return {
      processed: results.length,
      items: results,
    };
  }

  async listarMatrizOperacional(filters?: PriceStrategyFiltersDto) {
    const where: any = {};

    if (filters?.categoria) {
      where.category = { contains: String(filters.categoria).trim(), mode: 'insensitive' };
    }
    where.thickness = 0;
    where.group = 'AGRUPADO';

    return (this.prisma as any).operationalMatrix.findMany({
      where,
      orderBy: [{ category: 'asc' }],
      take: 30,
    });
  }
}
