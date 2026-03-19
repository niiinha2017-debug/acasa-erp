import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriceStrategyFiltersDto } from './dto/price-strategy-filters.dto';
import {
  FUNCIONARIOS_BASE_CALCULO,
  FUNCIONARIOS_TIPOS_CUSTO_KEYWORDS,
} from '../shared/constantes/funcionarios-custos';

type ProdutoComPreco = {
  id: number;
  nome_produto: string;
  categoria_base: string | null;
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
  cost_base?: number;
  adicional_fita_m2?: number;
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
  private readonly logger = new Logger(EstrategiaPrecosService.name);
  private readonly schemaChecks = new Map<string, boolean>();
  private readonly missingTableWarned = new Set<string>();
  private readonly MATRIX_AGGREGATED_GROUP = 'AGRUPADO';
  private readonly MATRIX_CACHE_CATEGORY = '_RH_CACHE_';
  private readonly MATRIX_CACHE_GROUP = '_CACHE_';
  private readonly MATRIX_SETTINGS_CATEGORY = '_SETTINGS_';
  private readonly MATRIX_SETTINGS_GROUP = '_PARAMS_';
  private readonly MATRIX_SELECTED_MDF_PREFIX = '__SEL__';
  private readonly MATRIX_SELECTED_KIT_CATEGORY = '_KIT_ITEM_';
  private readonly MATRIX_SELECTED_KIT_PREFIX = '__KIT__';

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

  private resolveInsumoConversao(item: {
    unidade?: string | null;
    insumo_fator_conversao?: any;
    insumo_unidade_referencia?: string | null;
  }) {
    const unidadeCompra = String(item?.unidade || '').trim().toUpperCase();
    const fatorInformado = Number(item?.insumo_fator_conversao ?? 0);
    const fatorDefault = unidadeCompra === 'KG' ? 1000 : unidadeCompra === 'PAR' ? 2 : 1;
    const fator = Number.isFinite(fatorInformado) && fatorInformado > 0 ? fatorInformado : fatorDefault;

    const unidadeReferencia =
      String(item?.insumo_unidade_referencia || '')
        .trim()
        .toUpperCase() ||
      (unidadeCompra === 'KG'
        ? 'G'
        : unidadeCompra === 'PAR'
          ? 'UN'
          : unidadeCompra === 'CX'
            ? 'UN'
            : unidadeCompra || 'UN');

    return {
      fator,
      unidadeCompra: unidadeCompra || null,
      unidadeReferencia,
    };
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

  private buildSelectedMdfGroupKey(group?: string): string {
    return `${this.MATRIX_SELECTED_MDF_PREFIX}${String(group || '').trim()}`;
  }

  private buildSelectedKitGroupKey(name?: string): string {
    return `${this.MATRIX_SELECTED_KIT_PREFIX}${String(name || '').trim()}`;
  }

  private stripSelectionPrefix(value?: string, prefix?: string): string {
    const text = String(value || '');
    if (!prefix || !text.startsWith(prefix)) return text;
    return text.slice(prefix.length);
  }

  private async getMatrixRuntimeSettings(): Promise<{
    lossMarginPct: number;
    markupBasePct: number;
  }> {
    if (!(await this.hasTable('operational_matrix'))) {
      return {
        lossMarginPct: this.CHAPA_LOSS_PCT,
        markupBasePct: 100,
      };
    }

    const row = await (this.prisma as any).operationalMatrix.findUnique({
      where: {
        category_thickness_group: {
          category: this.MATRIX_SETTINGS_CATEGORY,
          thickness: -2,
          group: this.MATRIX_SETTINGS_GROUP,
        },
      },
    });

    return {
      lossMarginPct: Number(row?.min_cost_base ?? this.CHAPA_LOSS_PCT),
      markupBasePct: Number(row?.avg_cost_base ?? 100),
    };
  }

  private buildWhere(filters?: PriceStrategyFiltersDto): any {
    const categoria = String(filters?.categoria ?? '').trim();
    const grupo = String(filters?.grupo ?? '').trim();
    const espessura = this.parseEspessura(filters?.espessura);

    return {
      status: 'ATIVO',
      ...(categoria
        ? {
            categoria_base: {
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

  private pickProdutoMedio(produtos: ProdutoComPreco[]): ProdutoComPreco | null {
    if (!produtos.length) return null;

    const ordered = [...produtos].sort((a, b) => this.toPrice(a) - this.toPrice(b));

    const avg =
      ordered.reduce((acc, item) => acc + this.toPrice(item), 0) / ordered.length;

    return ordered.reduce((closest, current) => {
      const currentDelta = Math.abs(this.toPrice(current) - avg);
      const closestDelta = Math.abs(this.toPrice(closest) - avg);
      return currentDelta < closestDelta ? current : closest;
    }, ordered[0]);
  }

  private computeAverageValue(prices: number[]): number {
    if (!prices.length) return 0;

    return prices.reduce((acc, current) => acc + current, 0) / prices.length;
  }

  async buscarProdutoReferencia(filters?: PriceStrategyFiltersDto) {
    const where = this.buildWhere(filters);

    const produtos = await (this.prisma as any).produtos.findMany({
      where,
      select: {
        id: true,
        nome_produto: true,
        categoria_base: true,
        marca: true,
        espessura_mm: true,
        valor_unitario: true,
        preco_m2: true,
      },
    });

    const escolhido = this.pickProdutoMedio(produtos as ProdutoComPreco[]);

    return {
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
    const where = this.buildWhere(filters);

    const produtos = (await this.prisma.produtos.findMany({
      where,
      select: {
        id: true,
        nome_produto: true,
        categoria_base: true,
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
        const avgValue = this.computeAverageValue(prices);

        const selectedItem = this.pickProdutoMedio(items);

        return {
          material: items[0]?.nome_produto ?? 'Material',
          categoria: items[0]?.categoria_base ?? null,
          grupo: items[0]?.marca ?? null,
          espessura_mm: items[0]?.espessura_mm ?? null,
          total_variacoes: items.length,
          min_price: minItem ? this.toPrice(minItem) : 0,
          avg_price: avgValue,
          max_price: maxItem ? this.toPrice(maxItem) : 0,
          valor_considerado: avgValue,
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

  /** Área padrão da chapa de MDF em m² (2,75 x 1,84) */
  private readonly AREA_CHAPA_M2 = 5.06;
  /** Perda operacional fixa para chapas (30%) */
  private readonly CHAPA_LOSS_PCT = 30;
  private readonly COMMERCIAL_CATEGORIES = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'] as const;

  private async hasTable(tableName: string): Promise<boolean> {
    const cacheKey = `table:${tableName}`;
    const cached = this.schemaChecks.get(cacheKey);
    if (cached != null) return cached;

    const result = (await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name = '${tableName}'`,
    )) as Array<{ total: bigint | number }>;

    const exists = Number(result?.[0]?.total ?? 0) > 0;
    this.schemaChecks.set(cacheKey, exists);
    return exists;
  }

  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const cacheKey = `column:${tableName}.${columnName}`;
    const cached = this.schemaChecks.get(cacheKey);
    if (cached != null) return cached;

    const result = (await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = '${tableName}'
         AND column_name = '${columnName}'`,
    )) as Array<{ total: bigint | number }>;

    const exists = Number(result?.[0]?.total ?? 0) > 0;
    this.schemaChecks.set(cacheKey, exists);
    return exists;
  }

  private warnMissingTableOnce(tableName: string, context: string, message: string) {
    const warnKey = `${tableName}:${context}`;
    if (this.missingTableWarned.has(warnKey)) return;
    this.missingTableWarned.add(warnKey);
    this.logger.warn(message);
  }

  private buildMdfProdutosWhere(_hasCategoriaBase: boolean, termo?: string): any {
    const where: any = {
      status: 'ATIVO',
      categoria_base: {
        in: [...this.COMMERCIAL_CATEGORIES],
      },
    };

    if (termo && termo.trim()) {
      where.nome_produto = {
        contains: termo.trim(),
      };
    }

    return where;
  }

  private buildMdfProdutosSelect(_hasCategoriaBase: boolean): any {
    return {
      categoria_base: true,
      espessura_mm: true,
      nome_produto: true,
      cor: true,
      marca: true,
      valor_unitario: true,
      adicional_fita_m2: true,
    };
  }

  private normalizeCommercialCategory(value?: string): 'PRIMARIA' | 'SECUNDARIA' | 'TERCIARIA' {
    const text = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();

    if (text.includes('SECUND') || text.includes('DESIGN') || text.includes('DESIGNER') || text.includes('DESGNER')) return 'SECUNDARIA';
    if (text.includes('TERCI') || text.includes('PREMIUM') || text.includes('PREMIUN')) return 'TERCIARIA';
    return 'PRIMARIA';
  }

  private normalizeColor(value?: string): string {
    return String(value || '').trim().toUpperCase();
  }

  private applyMatrixCalc(
    valorBase: number,
    adicionalFitaM2 = 0,
    lossMarginPct = this.CHAPA_LOSS_PCT,
  ): number {
    const custoCompraM2 = Number.isFinite(valorBase) && valorBase > 0
      ? valorBase / this.AREA_CHAPA_M2
      : 0;
    const adicional = Number.isFinite(adicionalFitaM2) && adicionalFitaM2 > 0 ? adicionalFitaM2 : 0;
    if (!custoCompraM2) return adicional > 0 ? adicional : 0;
    const margin = Number.isFinite(Number(lossMarginPct)) ? Number(lossMarginPct) : this.CHAPA_LOSS_PCT;
    return custoCompraM2 * (1 + margin / 100) + adicional;
  }

  private calcularCustoFitaPorMetroComMargem(
    valorRolo: number,
    metragemRolo: number,
    markupPct = 100,
  ): number {
    const metragem = Number(metragemRolo || 0);
    const valor = Number(valorRolo || 0);
    const markup = Number.isFinite(Number(markupPct)) ? Number(markupPct) : 100;
    const factor = 1 + markup / 100;
    if (!Number.isFinite(metragem) || metragem <= 0) return 0;
    if (!Number.isFinite(valor) || valor <= 0) return 0;
    return this.round4((valor / metragem) * factor);
  }

  private buildGruposMdfFromProdutos(produtos: Array<{
      categoria_base?: string | null;
      espessura_mm: number | null;
      nome_produto: string | null;
      cor?: string | null;
      marca?: string | null;
      valor_unitario: any;
      adicional_fita_m2?: any;
    }>, lossMarginPct = this.CHAPA_LOSS_PCT) {
    const groups = new Map<
      string,
      {
        category: string;
        thickness: number;
        group: string;
        color: string;
        commercial_category: string;
        prices: number[];
        adicionaisFitaM2: number[];
        search_terms: string[];
      }
    >();

    for (const p of produtos) {
      const category = this.normalizeCommercialCategory(p.categoria_base || '');
      const thickness = Number(p.espessura_mm ?? 0);
      const colorRaw = String(p.cor || p.nome_produto || '').trim();
      const group = colorRaw;
      const commercialCategory = category;

      if (!category || !group) continue;

      const key = `${category}__${thickness}__${group}__${commercialCategory}`;
      const price = Number(p.valor_unitario ?? 0);
      const entry = groups.get(key) ?? {
        category,
        thickness,
        group,
        color: colorRaw,
        commercial_category: commercialCategory,
        prices: [],
        adicionaisFitaM2: [],
        search_terms: [],
      };
      if (price > 0) entry.prices.push(price);
      const adicional = Number(p.adicional_fita_m2 ?? 0);
      if (Number.isFinite(adicional) && adicional >= 0) entry.adicionaisFitaM2.push(adicional);
      entry.search_terms.push(
        String(p.nome_produto || '').trim(),
        String(p.cor || '').trim(),
        String(p.marca || '').trim(),
        String(p.espessura_mm ?? '').trim(),
      );
      groups.set(key, entry);
    }

    return Array.from(groups.values()).map((entry) => {
      const min = entry.prices.length ? Math.min(...entry.prices) : 0;
      const max = entry.prices.length ? Math.max(...entry.prices) : 0;
      const avg =
        entry.prices.length > 0
          ? entry.prices.reduce((sum, p) => sum + p, 0) / entry.prices.length
          : 0;

      const adicionalFitaM2 =
        entry.adicionaisFitaM2.length > 0
          ? entry.adicionaisFitaM2.reduce((sum, value) => sum + value, 0) / entry.adicionaisFitaM2.length
          : 0;

      return {
        category: entry.category,
        thickness: entry.thickness,
        group: entry.group,
        color: entry.color,
        commercial_category: entry.commercial_category,
        search_terms: entry.search_terms.filter(Boolean).join(' '),
        reference_purchase_price: avg,
        adicional_fita_m2: adicionalFitaM2,
        cost_base: this.round4(this.applyMatrixCalc(avg, adicionalFitaM2, lossMarginPct)),
      };
    });
  }

  async listarGruposMdf() {
    const settings = await this.getMatrixRuntimeSettings();
    const hasCategoriaBase = await this.hasColumn('produtos', 'categoria_base');
    const produtos = await (this.prisma as any).produtos.findMany({
      where: this.buildMdfProdutosWhere(hasCategoriaBase),
      select: this.buildMdfProdutosSelect(hasCategoriaBase),
      orderBy: [{ categoria_base: 'asc' }, { espessura_mm: 'asc' }, { nome_produto: 'asc' }],
    });

    return this.buildGruposMdfFromProdutos(produtos, settings.lossMarginPct);
  }

  async buscarReferenciasMdfPorTermo(termo: string) {
    const texto = String(termo || '').trim();
    if (!texto) return [];

    const settings = await this.getMatrixRuntimeSettings();
    const hasCategoriaBase = await this.hasColumn('produtos', 'categoria_base');
    const produtos = await (this.prisma as any).produtos.findMany({
      where: this.buildMdfProdutosWhere(hasCategoriaBase, texto),
      select: this.buildMdfProdutosSelect(hasCategoriaBase),
      orderBy: [{ categoria_base: 'asc' }, { espessura_mm: 'asc' }, { nome_produto: 'asc' }],
      take: 200,
    });

    return this.buildGruposMdfFromProdutos(produtos, settings.lossMarginPct);
  }

  async buscarMdfPorCategoriaComercial(categoriaComercial: string, termo?: string) {
    const normalized = this.normalizeCommercialCategory(categoriaComercial);

    const settings = await this.getMatrixRuntimeSettings();
    const hasCategoriaBase = await this.hasColumn('produtos', 'categoria_base');
    const produtos = await (this.prisma as any).produtos.findMany({
      where: this.buildMdfProdutosWhere(hasCategoriaBase, termo),
      select: this.buildMdfProdutosSelect(hasCategoriaBase),
      orderBy: [{ categoria_base: 'asc' }, { espessura_mm: 'asc' }, { nome_produto: 'asc' }],
    });

    const filtered = produtos.filter(
      (p) => this.normalizeCommercialCategory(p.categoria_base || '') === normalized,
    );

    return this.buildGruposMdfFromProdutos(filtered, settings.lossMarginPct);
  }

  async buscarCustoConsolidadoMdf(produtoId: number) {
    const id = Number(produtoId || 0);
    if (!Number.isFinite(id) || id <= 0) {
      return {
        produto_id: 0,
        custo_mdf_m2: 0,
        custo_fita_metro: 0,
        custo_consolidado: 0,
      };
    }

    const mdf = await (this.prisma as any).produtos.findUnique({
      where: { id },
      select: {
        id: true,
        nome_produto: true,
        categoria_base: true,
        valor_unitario: true,
        preco_m2: true,
        fita_vinculada_id: true,
      },
    });

    if (!mdf) {
      return {
        produto_id: id,
        custo_mdf_m2: 0,
        custo_fita_metro: 0,
        custo_consolidado: 0,
      };
    }

    const settings = await this.getMatrixRuntimeSettings();
    const valorChapa = Number(mdf?.valor_unitario ?? mdf?.preco_m2 ?? 0);
    const custoMdfM2 = this.round4(this.applyMatrixCalc(valorChapa, 0, settings.lossMarginPct));

    let fita: any = null;
    let custoFitaMetro = 0;

    const fitaId = Number(mdf?.fita_vinculada_id || 0);
    if (fitaId > 0) {
      fita = await (this.prisma as any).produtos.findUnique({
        where: { id: fitaId },
        select: {
          id: true,
          nome_produto: true,
          valor_unitario: true,
          metragem_rolo_m: true,
          categoria_base: true,
        },
      });

      if (fita) {
        custoFitaMetro = this.calcularCustoFitaPorMetroComMargem(
          Number(fita?.valor_unitario || 0),
          Number(fita?.metragem_rolo_m || 0),
          settings.markupBasePct,
        );
      }
    }

    return {
      produto_id: Number(mdf.id),
      produto_nome: mdf.nome_produto,
      categoria_base: mdf.categoria_base,
      custo_mdf_m2: custoMdfM2,
      fita_vinculada_id: fita ? Number(fita.id) : null,
      fita_nome: fita?.nome_produto ?? null,
      custo_fita_metro: custoFitaMetro,
      custo_consolidado: this.round4(custoMdfM2 + custoFitaMetro),
    };
  }

  async listarInsumosFixos() {
    const produtos = await (this.prisma as any).produtos.findMany({
      where: {
        status: 'ATIVO',
        categoria_base: 'INSUMO',
      },
      select: {
        id: true,
        nome_produto: true,
        unidade: true,
        insumo_fator_conversao: true,
        insumo_unidade_referencia: true,
        insumo_consumo_m2: true,
        categoria_base: true,
        valor_unitario: true,
      },
      orderBy: [{ nome_produto: 'asc' }],
    });

    return produtos.map((item: any) => {
      const conv = this.resolveInsumoConversao(item);
      const valorCompra = Number(item.valor_unitario ?? 0);
      const valorReferencia = conv.fator > 0 ? valorCompra / conv.fator : valorCompra;
      const consumoM2 = Number(item.insumo_consumo_m2 ?? 0);
      const valueM2Base =
        Number.isFinite(consumoM2) && consumoM2 > 0 ? valorReferencia * consumoM2 : 0;
      const valueM2 = valueM2Base > 0 ? this.round4(valueM2Base * 2) : 0;

      return {
        unidade_compra: conv.unidadeCompra,
        unidade_referencia: conv.unidadeReferencia,
        fator_conversao: conv.fator,
        consumo_m2: Number.isFinite(consumoM2) && consumoM2 > 0 ? this.round4(consumoM2) : null,
        value_compra: valorCompra,
        value_referencia: valorReferencia,
        value_m2_base: this.round4(valueM2Base),
        value_m2: valueM2,
        id: item.id,
        name: item.nome_produto,
        unidade: item.unidade,
        categoria_base: item.categoria_base ?? null,
        // Compatibilidade com frontend atual: value representa custo na unidade de referência.
        value: valorReferencia,
        selected: true,
      };
    });
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

    if (!(await this.hasTable('operational_matrix'))) {
      this.warnMissingTableOnce(
        'operational_matrix',
        'recalcularCMVPorFuncionarios',
        'Tabela operational_matrix ausente. Recalculo de CMV executado sem persistencia.',
      );
      return {
        ...rh,
        kit_value: 0,
        custo_fixo_value: 0,
        novo_fix_insumo_value: this.round4(rh.custoM2Producao),
      };
    }

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
    if (!(await this.hasTable('operational_matrix'))) {
      this.warnMissingTableOnce(
        'operational_matrix',
        'processOperationalMatrix',
        'Tabela operational_matrix ausente. Processamento ignorado para evitar erro 500.',
      );
      return {
        processed: 0,
        items: [],
      };
    }

    const materialLinks = Array.isArray(payload?.material_links) ? payload.material_links : [];
    const lossMarginPct = Math.max(0, Number(payload?.loss_margin_pct ?? this.CHAPA_LOSS_PCT));
    const markupBasePct = Math.max(0, Number(payload?.markup_base_pct ?? 100));
    const markupFactor = 1 + markupBasePct / 100;
    const selectedKitItems = (Array.isArray(payload?.kit_items) ? payload.kit_items : []).filter(
      (item) => item?.selected !== false,
    );

    const selectedKitIds = selectedKitItems
      .map((item) => Number(item?.id ?? 0))
      .filter((id) => Number.isFinite(id) && id > 0);

    const produtosKit = selectedKitIds.length
      ? await (this.prisma as any).produtos.findMany({
          where: { id: { in: selectedKitIds } },
          select: {
            id: true,
            categoria_base: true,
            valor_unitario: true,
            unidade: true,
            insumo_fator_conversao: true,
            insumo_unidade_referencia: true,
            metragem_rolo_m: true,
          },
        })
      : [];

    const produtoKitMap = new Map<number, any>(
      (Array.isArray(produtosKit) ? produtosKit : []).map((item: any) => [Number(item.id), item]),
    );

    const normalizedKitItems = selectedKitItems.map((item) => {
      const itemId = Number(item?.id ?? 0);
      const produto = produtoKitMap.get(itemId);
      const categoria = String(
        produto?.categoria_base ?? item?.categoria_base ?? 'INSUMO',
      )
        .trim()
        .toUpperCase();

      let value = Number(item?.value ?? 0);

      if (produto && categoria === 'INSUMO') {
        const conv = this.resolveInsumoConversao(produto);
        const valorCompra = Number(produto?.valor_unitario ?? 0);
        const valorReferencia = conv.fator > 0 ? valorCompra / conv.fator : valorCompra;
        value = this.round4(valorReferencia * markupFactor);
      } else if (produto && categoria === 'FITA_BORDA') {
        value = this.calcularCustoFitaPorMetroComMargem(
          Number(produto?.valor_unitario ?? 0),
          Number(produto?.metragem_rolo_m ?? 0),
          markupBasePct,
        );
      }

      return {
        ...item,
        id: itemId,
        categoria_base: categoria,
        value,
      };
    });

    const kitValue = normalizedKitItems.reduce((acc, item) => acc + Number(item?.value ?? 0), 0);
    const fitaValue = normalizedKitItems
      .filter((item) => item?.categoria_base === 'FITA_BORDA')
      .reduce((acc, item) => acc + Number(item?.value ?? 0), 0);
    const insumoValue = normalizedKitItems
      .filter((item) => item?.categoria_base === 'INSUMO')
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
    const grouped = new Map<string, { costs: number[]; thicknesses: Set<number> }>();

    await (this.prisma as any).operationalMatrix.deleteMany({
      where: {
        OR: [
          {
            group: {
              startsWith: this.MATRIX_SELECTED_MDF_PREFIX,
            },
          },
          {
            category: this.MATRIX_SELECTED_KIT_CATEGORY,
          },
        ],
      },
    });

    for (const link of selectedLinks) {
      const category = this.normalizeCommercialCategory(
        link?.commercial_category || link?.category || link?.group || '',
      );

      const referencePrice = Number(
        link?.reference_purchase_price ??
          link?.cost_base ??
          link?.avg_purchase_price ??
          link?.min_purchase_price ??
          link?.max_purchase_price ??
          0,
      );

      const additionalTapePerM2 = Number(link?.adicional_fita_m2 ?? 0);
      const informedCostBase = Number(link?.cost_base ?? 0);
      const costBaseM2 =
        Number.isFinite(informedCostBase) && informedCostBase > 0
          ? informedCostBase
          : this.applyMatrixCalc(referencePrice, additionalTapePerM2, lossMarginPct);
      if (!Number.isFinite(costBaseM2) || costBaseM2 <= 0) continue;

      const thickness = Number(link?.thickness ?? 0);
      const selectedGroup = this.buildSelectedMdfGroupKey(link?.group);

      await (this.prisma as any).operationalMatrix.upsert({
        where: {
          category_thickness_group: {
            category,
            thickness,
            group: selectedGroup,
          },
        },
        update: {
          min_cost_base: costBaseM2,
          avg_cost_base: costBaseM2,
          max_cost_base: costBaseM2,
          mdf_extra_pct: additionalTapePerM2,
          fix_insumo_value: referencePrice,
        },
        create: {
          category,
          thickness,
          group: selectedGroup,
          min_cost_base: costBaseM2,
          avg_cost_base: costBaseM2,
          max_cost_base: costBaseM2,
          mdf_extra_pct: additionalTapePerM2,
          fix_insumo_value: referencePrice,
        },
      });

      const current = grouped.get(category) ?? { costs: [], thicknesses: new Set<number>() };
      current.costs.push(costBaseM2);
      if (thickness > 0) current.thicknesses.add(thickness);
      grouped.set(category, current);
    }

    for (const item of normalizedKitItems) {
      const itemId = Number(item?.id ?? 0);
      if (!itemId) continue;

      await (this.prisma as any).operationalMatrix.upsert({
        where: {
          category_thickness_group: {
            category: this.MATRIX_SELECTED_KIT_CATEGORY,
            thickness: itemId,
            group: this.buildSelectedKitGroupKey(item?.name),
          },
        },
        update: {
          min_cost_base: 0,
          avg_cost_base: Number(item?.value ?? 0),
          max_cost_base: 0,
          mdf_extra_pct: 0,
          fix_insumo_value: 0,
        },
        create: {
          category: this.MATRIX_SELECTED_KIT_CATEGORY,
          thickness: itemId,
          group: this.buildSelectedKitGroupKey(item?.name),
          min_cost_base: 0,
          avg_cost_base: Number(item?.value ?? 0),
          max_cost_base: 0,
          mdf_extra_pct: 0,
          fix_insumo_value: 0,
        },
      });
    }

    const results: any[] = [];

    for (const [category, data] of grouped.entries()) {
      const costs = data.costs.filter((p) => Number.isFinite(p) && p > 0);
      if (!costs.length) continue;

      const consolidatedCostBase = costs.reduce((sum, value) => sum + value, 0) / costs.length;
      const categoryAcrescimoPct = Number(
        selectedLinks.find(
          (link) =>
            this.normalizeCommercialCategory(
              link?.commercial_category || link?.category || link?.group || '',
            ) === category,
        )?.acrescimo_pct ?? 0,
      );

      const savePayload = {
        min_cost_base: consolidatedCostBase,
        avg_cost_base: consolidatedCostBase,
        max_cost_base: consolidatedCostBase,
        fix_insumo_value: fixInsumoValue,
        mdf_extra_pct: categoryAcrescimoPct,
      };

      const record = await (this.prisma as any).operationalMatrix.upsert({
        where: {
          category_thickness_group: {
            category,
            thickness: 0,
            group: this.MATRIX_AGGREGATED_GROUP,
          },
        },
        update: savePayload,
        create: {
          category,
          thickness: 0,
          group: this.MATRIX_AGGREGATED_GROUP,
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
          category: this.MATRIX_SETTINGS_CATEGORY,
          thickness: -2,
          group: this.MATRIX_SETTINGS_GROUP,
        },
      },
      update: {
        min_cost_base: lossMarginPct,
        avg_cost_base: markupBasePct,
        max_cost_base: 0,
        fix_insumo_value: 0,
        mdf_extra_pct: 0,
      },
      create: {
        category: this.MATRIX_SETTINGS_CATEGORY,
        thickness: -2,
        group: this.MATRIX_SETTINGS_GROUP,
        min_cost_base: lossMarginPct,
        avg_cost_base: markupBasePct,
        max_cost_base: 0,
        fix_insumo_value: 0,
        mdf_extra_pct: 0,
      },
    });

    await (this.prisma as any).operationalMatrix.upsert({
      where: {
        category_thickness_group: {
          category: this.MATRIX_CACHE_CATEGORY,
          thickness: -1,
          group: this.MATRIX_CACHE_GROUP,
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
        category: this.MATRIX_CACHE_CATEGORY,
        thickness: -1,
        group: this.MATRIX_CACHE_GROUP,
        min_cost_base: horaHomemValue,
        avg_cost_base: custoFixoFabricaValue,
        max_cost_base: kitValue,
        fix_insumo_value: 0,
        mdf_extra_pct: 0,
      },
    });

    if (await this.hasTable('configuracoes_preco')) {
      for (const item of results) {
        const mdfMin = Number(item?.min_cost_base || 0);
        const mdfAvg = Number(item?.avg_cost_base || 0);
        const rhDespesas = this.round4(horaHomemValue + custoFixoFabricaValue);
        const finalValue = this.round4(mdfAvg + fitaValue + insumoValue + rhDespesas);

        const saveConfigPayload = {
          mdf_min_value: this.round4(mdfAvg),
          mdf_avg_value: this.round4(mdfAvg),
          mdf_max_value: this.round4(mdfAvg),
          fita_value: this.round4(fitaValue),
          insumo_value: this.round4(insumoValue),
          rh_despesas_value: this.round4(rhDespesas),
          final_min_value: finalValue,
          final_avg_value: finalValue,
          final_max_value: finalValue,
          origem: 'MATRIZ_OPERACIONAL',
        };

        await (this.prisma as any).configuracoesPreco.upsert({
          where: { categoria_comercial: String(item.category || '') },
          update: saveConfigPayload,
          create: {
            categoria_comercial: String(item.category || ''),
            ...saveConfigPayload,
          },
        });
      }
    }

    return {
      processed: results.length,
      items: results,
    };
  }

  async listarConfiguracoesPreco() {
    if (!(await this.hasTable('configuracoes_preco'))) return [];

    return (this.prisma as any).configuracoesPreco.findMany({
      orderBy: [{ categoria_comercial: 'asc' }],
      take: 20,
    });
  }

  async listarSelecoesMatrizOperacional() {
    if (!(await this.hasTable('operational_matrix'))) {
      return {
        material_links: [],
        kit_items: [],
        hora_homem_value: 0,
        custo_fixo_fabrica_value: 0,
        loss_margin_pct: this.CHAPA_LOSS_PCT,
        markup_base_pct: 100,
      };
    }

    const [rows, cacheRow, settingsRow] = await Promise.all([
      (this.prisma as any).operationalMatrix.findMany({
        where: {
          OR: [
            {
              group: {
                startsWith: this.MATRIX_SELECTED_MDF_PREFIX,
              },
            },
            {
              category: this.MATRIX_SELECTED_KIT_CATEGORY,
            },
          ],
        },
        orderBy: [{ category: 'asc' }, { thickness: 'asc' }, { group: 'asc' }],
      }),
      (this.prisma as any).operationalMatrix.findUnique({
        where: {
          category_thickness_group: {
            category: this.MATRIX_CACHE_CATEGORY,
            thickness: -1,
            group: this.MATRIX_CACHE_GROUP,
          },
        },
      }),
      (this.prisma as any).operationalMatrix.findUnique({
        where: {
          category_thickness_group: {
            category: this.MATRIX_SETTINGS_CATEGORY,
            thickness: -2,
            group: this.MATRIX_SETTINGS_GROUP,
          },
        },
      }),
    ]);

    const materialLinks = (Array.isArray(rows) ? rows : [])
      .filter((row: any) => String(row?.group || '').startsWith(this.MATRIX_SELECTED_MDF_PREFIX))
      .map((row: any) => ({
        category: row.category,
        commercial_category: row.category,
        thickness: Number(row.thickness || 0),
        group: this.stripSelectionPrefix(row.group, this.MATRIX_SELECTED_MDF_PREFIX),
        cost_base: Number(row.avg_cost_base || row.min_cost_base || row.max_cost_base || 0),
        reference_purchase_price: Number(row.fix_insumo_value || 0),
        adicional_fita_m2: Number(row.mdf_extra_pct || 0),
        selected: true,
      }));

    const kitItems = (Array.isArray(rows) ? rows : [])
      .filter((row: any) => String(row?.category || '') === this.MATRIX_SELECTED_KIT_CATEGORY)
      .map((row: any) => ({
        id: Number(row.thickness || 0),
        name: this.stripSelectionPrefix(row.group, this.MATRIX_SELECTED_KIT_PREFIX),
        categoria_base: 'INSUMO',
        value: Number(row.avg_cost_base || 0),
        selected: true,
      }));

    return {
      material_links: materialLinks,
      kit_items: kitItems,
      hora_homem_value: Number(cacheRow?.min_cost_base || 0),
      custo_fixo_fabrica_value: Number(cacheRow?.avg_cost_base || 0),
      loss_margin_pct: Number(settingsRow?.min_cost_base ?? this.CHAPA_LOSS_PCT),
      markup_base_pct: Number(settingsRow?.avg_cost_base ?? 100),
    };
  }

  async listarMatrizOperacional(filters?: PriceStrategyFiltersDto) {
    if (await this.hasTable('configuracoes_preco')) {
      const categoriaFiltro = String(filters?.categoria || '').trim().toUpperCase();
      const rows = await (this.prisma as any).configuracoesPreco.findMany({
        where: categoriaFiltro
          ? { categoria_comercial: { contains: categoriaFiltro } }
          : undefined,
        orderBy: [{ categoria_comercial: 'asc' }],
        take: 30,
      });

      if ((rows || []).length > 0) {
        return rows.map((row: any) => ({
          category: row.categoria_comercial,
          thickness: 0,
          group: this.MATRIX_AGGREGATED_GROUP,
          cost_base: Number(row.mdf_avg_value || 0),
          fix_insumo_value: this.round4(
            Number(row.fita_value || 0) +
              Number(row.insumo_value || 0) +
              Number(row.rh_despesas_value || 0),
          ),
          mdf_extra_pct: 0,
          atualizado_em: row.atualizado_em,
          origem: row.origem,
          final_value: Number(row.final_avg_value || 0),
        }));
      }
    }

    if (!(await this.hasTable('operational_matrix'))) {
      this.warnMissingTableOnce(
        'operational_matrix',
        'listarMatrizOperacional',
        'Tabela operational_matrix ausente. Listagem retornada vazia.',
      );
      return [];
    }

    const where: any = {};

    if (filters?.categoria) {
      where.category = { contains: String(filters.categoria).trim(), mode: 'insensitive' };
    }
    where.thickness = 0;
    where.group = this.MATRIX_AGGREGATED_GROUP;

    return (this.prisma as any).operationalMatrix.findMany({
      where,
      orderBy: [{ category: 'asc' }],
      take: 30,
    }).then((rows: any[]) =>
      rows.map((row) => ({
        ...row,
        cost_base: Number(row?.avg_cost_base || 0),
        final_value: this.round4(Number(row?.avg_cost_base || 0) + Number(row?.fix_insumo_value || 0)),
      })),
    );
  }
}
