import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PriceStrategyFiltersDto } from './dto/price-strategy-filters.dto';

const GLOBAL_CONFIG_KEY = 'PRICING_SEARCH_STRATEGY';
type SearchStrategy = 'MIN_PRICE' | 'AVG_PRICE' | 'MAX_PRICE';

type ProdutoComPreco = {
  id: number;
  nome_produto: string;
  categoria: string | null;
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
  tipo_aplicacao?: string;
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
  fix_insumo_per_m2?: number;
};

@Injectable()
export class EstrategiaPrecosService {
  constructor(private readonly prisma: PrismaService) {}

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
      const commercialCategory = this.normalizeCommercialCategory(p.marca || p.categoria || p.nome_produto || '');

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
        tipo_aplicacao: {
          in: ['MDF', 'MATERIA_PRIMA'],
        },
        categoria: {
          contains: 'MDF',
        },
      },
      select: {
        categoria: true,
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
        tipo_aplicacao: {
          in: ['MDF', 'MATERIA_PRIMA'],
        },
        categoria: {
          contains: 'MDF',
        },
        nome_produto: {
          contains: texto,
        },
      },
      select: {
        categoria: true,
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
        tipo_aplicacao: {
          in: ['MDF', 'MATERIA_PRIMA'],
        },
        categoria: { contains: 'MDF' },
      },
      select: {
        categoria: true,
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
          p.marca || p.categoria || p.nome_produto || '',
        ) === normalized,
    );

    return this.buildGruposMdfFromProdutos(filtered, useStrategy);
  }

  async listarInsumosFixos() {
    const produtos = await (this.prisma as any).produtos.findMany({
      where: {
        status: 'ATIVO',
        tipo_aplicacao: 'INSUMO',
      },
      select: {
        id: true,
        nome_produto: true,
        unidade: true,
        categoria: true,
        tipo_aplicacao: true,
        valor_unitario: true,
      },
      orderBy: [{ nome_produto: 'asc' }],
    });

    return produtos.map((item: any) => ({
      id: item.id,
      name: item.nome_produto,
      unidade: item.unidade,
      categoria: item.categoria,
      tipo_aplicacao: item.tipo_aplicacao,
      value: Number(item.valor_unitario ?? 0),
      selected: true,
    }));
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
    const fixInsumoValue = (Array.isArray(payload?.kit_items) ? payload.kit_items : [])
      .filter((item) => item?.selected !== false)
      .reduce((acc, item) => acc + Number(item?.value ?? 0), 0);
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
