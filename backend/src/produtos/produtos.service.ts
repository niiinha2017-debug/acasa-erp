import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/criar-produto.dto';
import { UpdateProdutoDto } from './dto/atualizar-produto.dto';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}
  private readonly markup100Factor = 2;
  private readonly commercialCategories = ['PRIMARIA', 'SECUNDARIA', 'TERCIARIA'] as const;

  private normalizeCategoriaBase(categoriaBase?: string | null) {
    const base = String(categoriaBase || '')
      .trim()
      .toUpperCase();
    if (base) return base;

    return 'PRIMARIA';
  }

  private isCategoriaComercial(categoriaBase?: string | null) {
    const categoria = this.normalizeCategoriaBase(categoriaBase);
    return this.commercialCategories.includes(categoria as (typeof this.commercialCategories)[number]);
  }

  private isCategoriaFitaBorda(categoriaBase?: string | null) {
    return this.normalizeCategoriaBase(categoriaBase) === 'FITA_BORDA';
  }

  private aplicarFiltroCategoriaBaseComLegado(
    where: Record<string, any>,
    categoriaBase?: string | null,
  ) {
    const categoria = String(categoriaBase || '')
      .trim()
      .toUpperCase();

    if (!categoria) return;

    // Produtos legados sem categoria_base são tratados como PRIMARIA
    if (categoria === 'PRIMARIA') {
      where.OR = [
        { categoria_base: 'PRIMARIA' },
        { categoria_base: null },
        { categoria_base: '' },
      ];
    } else {
      where.categoria_base = categoria;
    }
  }

  private normStr(v: any) {
    const s = String(v ?? '').trim();
    return s.length ? s : null;
  }

  private normalizeDecimal(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(String(value).replace(',', '.').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  private roundNumber(value: number, precision = 4): number {
    const factor = 10 ** precision;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  private normalizeMetragemRolo(
    metragemRolo: any,
    categoriaBase?: string | null,
  ): number | null {
    if (!this.isCategoriaFitaBorda(categoriaBase)) return null;

    const parsed = this.normalizeDecimal(metragemRolo);
    if (parsed == null || parsed <= 0) return null;
    return this.roundNumber(parsed, 3);
  }

  private formatarMedidaFita(metragemRoloM: number | null): string | null {
    if (!Number.isFinite(Number(metragemRoloM)) || Number(metragemRoloM) <= 0) return null;
    const texto = String(this.roundNumber(Number(metragemRoloM), 3)).replace(/\.0+$|0+$/g, '');
    return `${texto.replace(/\.$/, '')}m`;
  }

  private resolveMedidaProduto(
    medidaInformada: string | null,
    categoriaBase?: string | null,
    metragemRoloM?: number | null,
  ): string | null {
    if (this.isCategoriaFitaBorda(categoriaBase)) {
      return this.formatarMedidaFita(metragemRoloM ?? null);
    }

    return medidaInformada;
  }

  private async resolveFitaVinculada(
    fitaVinculadaId: any,
    categoriaBase?: string | null,
  ): Promise<{
    fita_vinculada_id: number | null;
    adicional_fita_m2: number | null;
    fita_vinculada: any | null;
  }> {
    if (!this.isCategoriaComercial(categoriaBase)) {
      return {
        fita_vinculada_id: null,
        adicional_fita_m2: null,
        fita_vinculada: null,
      };
    }

    const fitaId = Number(fitaVinculadaId ?? 0);
    if (!Number.isFinite(fitaId) || fitaId <= 0) {
      return {
        fita_vinculada_id: null,
        adicional_fita_m2: null,
        fita_vinculada: null,
      };
    }

    const fita = await (this.prisma as any).produtos.findUnique({
      where: { id: fitaId },
      select: {
        id: true,
        nome_produto: true,
        cor: true,
        medida: true,
        categoria_base: true,
        metragem_rolo_m: true,
        valor_unitario: true,
        status: true,
      },
    });

    if (!fita) {
      throw new BadRequestException('A fita vinculada selecionada não foi encontrada.');
    }

    if (!this.isCategoriaFitaBorda(fita.categoria_base)) {
      throw new BadRequestException('O produto vinculado precisa ser da categoria Fita de Borda.');
    }

    const metragemRoloM = this.normalizeDecimal(fita.metragem_rolo_m);
    if (metragemRoloM == null || metragemRoloM <= 0) {
      throw new BadRequestException('A fita vinculada precisa ter a metragem do rolo preenchida.');
    }

    const valorUnitario = Number(fita.valor_unitario ?? 0);
    const adicionalFitaM2 = valorUnitario > 0 ? this.roundNumber(valorUnitario / metragemRoloM, 4) : 0;

    return {
      fita_vinculada_id: fitaId,
      adicional_fita_m2: adicionalFitaM2,
      fita_vinculada: {
        id: fita.id,
        nome_produto: fita.nome_produto,
        cor: fita.cor,
        medida: fita.medida,
        categoria_base: fita.categoria_base,
        metragem_rolo_m: metragemRoloM,
        valor_unitario: valorUnitario,
        status: fita.status,
      },
    };
  }

  private normalizeInsumoFatorConversao(
    fator: any,
    unidadeCompra?: string | null,
    categoriaBase?: string | null,
  ): number | null {
    const categoria = String(categoriaBase || '').trim().toUpperCase();
    if (categoria !== 'INSUMO') return null;

    const raw = fator === undefined || fator === null || fator === '' ? null : Number(fator);
    if (raw != null && Number.isFinite(raw) && raw > 0) return raw;

    const unidade = String(unidadeCompra || '').trim().toUpperCase();
    if (unidade === 'KG') return 1000;
    if (unidade === 'PAR') return 2;

    return 1;
  }

  private normalizeFatorConversao(
    fator: any,
    unidadeCompra?: string | null,
    categoriaBase?: string | null,
  ): number {
    const base = this.normalizeInsumoFatorConversao(fator, unidadeCompra, categoriaBase);
    const n = Number(base ?? 1);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return n;
  }

  private calcCustoUnitarioReal(valorUnitario: number, fatorConversao: number): number {
    const fator = Number(fatorConversao);
    if (!Number.isFinite(fator) || fator <= 0) return Number(valorUnitario || 0);
    return Number(valorUnitario || 0) / fator;
  }

  private normalizeInsumoConsumoM2(
    consumoM2: any,
    categoriaBase?: string | null,
  ): number | null {
    const categoria = String(categoriaBase || '').trim().toUpperCase();
    if (categoria !== 'INSUMO') return null;

    const parsed = this.normalizeDecimal(consumoM2);
    if (parsed == null || parsed < 0) return null;
    return this.roundNumber(parsed, 4);
  }

  private normalizeInsumoUnidadeReferencia(
    unidadeRef: any,
    unidadeCompra?: string | null,
    categoriaBase?: string | null,
  ): string | null {
    const categoria = String(categoriaBase || '').trim().toUpperCase();
    if (categoria !== 'INSUMO') return null;

    const informada = this.normStr(unidadeRef)?.toUpperCase();
    if (informada) return informada;

    const unidade = String(unidadeCompra || '').trim().toUpperCase();
    if (unidade === 'KG') return 'G';
    if (unidade === 'PAR') return 'UN';
    if (unidade === 'CX') return 'UN';
    return unidade || 'UN';
  }

  private async checarDuplicado(params: {
    fornecedor_id: number;
    nome_produto: string;
    marca: string | null;
    cor: string | null;
    medida: string | null;
    ignorarId?: number;
  }) {
    const dup = await this.prisma.produtos.findFirst({
      where: {
        fornecedor_id: params.fornecedor_id,
        nome_produto: params.nome_produto,
        marca: params.marca,
        cor: params.cor,
        medida: params.medida,
        ...(params.ignorarId ? { id: { not: params.ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (dup) {
      throw new BadRequestException(
        'Já existe um produto com o mesmo fornecedor, nome do produto, marca, cor e medida. Não é permitido duplicar.',
      );
    }
  }

  private multiplicarCom2Casas(valor: any) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return valor;
    return Math.round(n * this.markup100Factor * 100) / 100;
  }

  private aplicarMarkupProduto(produto: any, aplicarMarkup100?: boolean) {
    if (!aplicarMarkup100 || !produto) return produto;
    return {
      ...produto,
      valor_unitario: this.multiplicarCom2Casas(produto.valor_unitario),
      valor_total: this.multiplicarCom2Casas(produto.valor_total),
      preco_m2: this.multiplicarCom2Casas(produto.preco_m2),
    };
  }

  async criar(dto: CreateProdutoDto) {
    const fornecedor_id = Number(dto.fornecedor_id);
    if (!fornecedor_id)
      throw new BadRequestException('fornecedor_id é obrigatório.');

    const nome_produto = String(dto.nome_produto ?? '').trim();
    if (!nome_produto)
      throw new BadRequestException('nome_produto é obrigatório.');

    const marca = this.normStr(dto.marca);
    const cor = this.normStr(dto.cor);
    const largura_mm =
      dto.largura_mm === undefined ? null : Number(dto.largura_mm);
    const comprimento_mm =
      dto.comprimento_mm === undefined ? null : Number(dto.comprimento_mm);
    const espessura_mm =
      dto.espessura_mm === undefined ? null : Number(dto.espessura_mm);
    const categoria_base = this.normalizeCategoriaBase(
      this.normStr((dto as any).categoria_base),
    );
    const metragem_rolo_m = this.normalizeMetragemRolo(
      (dto as any).metragem_rolo_m,
      categoria_base,
    );
    if (this.isCategoriaFitaBorda(categoria_base) && (metragem_rolo_m == null || metragem_rolo_m <= 0)) {
      throw new BadRequestException('Metragem do rolo é obrigatória para produtos da categoria Fita de Borda.');
    }
    const medida = this.resolveMedidaProduto(
      this.normStr(dto.medida),
      categoria_base,
      metragem_rolo_m,
    );
    const preco_m2 = dto.preco_m2 === undefined ? null : Number(dto.preco_m2);
    const adicional_fita_m2_informado =
      (dto as any).adicional_fita_m2 === undefined
        ? null
        : Number((dto as any).adicional_fita_m2);
    const fitaVinculada = await this.resolveFitaVinculada(
      (dto as any).fita_vinculada_id,
      categoria_base,
    );
    const adicional_fita_m2 =
      fitaVinculada.adicional_fita_m2 ?? adicional_fita_m2_informado;
    const unidade = this.normStr(dto.unidade);
    const unidade_compra =
      this.normStr((dto as any).unidade_compra) ?? unidade;
    const unidade_consumo =
      this.normStr((dto as any).unidade_consumo) ??
      this.normStr((dto as any).insumo_unidade_referencia);
    const insumo_fator_conversao = this.normalizeInsumoFatorConversao(
      (dto as any).insumo_fator_conversao ?? (dto as any).fator_conversao,
      unidade_compra,
      categoria_base,
    );
    const fator_conversao = this.normalizeFatorConversao(
      (dto as any).fator_conversao ?? (dto as any).insumo_fator_conversao,
      unidade_compra,
      categoria_base,
    );
    const insumo_unidade_referencia = this.normalizeInsumoUnidadeReferencia(
      (dto as any).insumo_unidade_referencia ?? (dto as any).unidade_consumo,
      unidade_compra,
      categoria_base,
    );
    const insumo_consumo_m2 = this.normalizeInsumoConsumoM2(
      (dto as any).insumo_consumo_m2,
      categoria_base,
    );
    const valor_unitario = Number(dto.valor_unitario ?? 0);
    const custo_unitario_real = this.calcCustoUnitarioReal(valor_unitario, fator_conversao);

    await this.checarDuplicado({
      fornecedor_id,
      nome_produto,
      marca,
      cor,
      medida,
    });

    const createData = {
      fornecedor: { connect: { id: fornecedor_id } },
      nome_produto,
      marca,
      cor,
      unidade,
      unidade_compra,
      unidade_consumo,
      medida,
      largura_mm,
      comprimento_mm,
      espessura_mm,
      metragem_rolo_m,
      preco_m2,
      adicional_fita_m2,
      quantidade: Number(dto.quantidade ?? 0),
      estoque_minimo: dto.estoque_minimo !== undefined ? Number(dto.estoque_minimo) : 0,
      valor_unitario,
      custo_unitario_real,
      valor_total: Number(dto.valor_total ?? 0),
      fator_conversao,
      insumo_fator_conversao,
      insumo_unidade_referencia,
      insumo_consumo_m2,
      categoria_base,
      fita_vinculada_id: fitaVinculada.fita_vinculada_id,
      categoria_ferragem:
        this.normStr((dto as any).categoria_ferragem) ?? null,
      imagem_url: this.normStr(dto.imagem_url),
      status: dto.status ?? 'ATIVO',
    };
    return this.prisma.produtos.create({ data: createData as any });
  }

  async listar(
    filtro?: { fornecedor_id?: number; categoria_base?: string },
    opts?: { page?: number; pageSize?: number },
    ctx?: { aplicarMarkup100?: boolean },
  ) {
    const where: any = {};
    if (filtro?.fornecedor_id) where.fornecedor_id = filtro.fornecedor_id;
    if (filtro?.categoria_base) {
      this.aplicarFiltroCategoriaBaseComLegado(where, filtro.categoria_base);
    }

    // Sem paginação: compatibilidade com chamadas existentes
    if (!opts || !opts.page) {
      const data = await this.prisma.produtos.findMany({
        where,
        include: {
          fornecedor: {
            select: { id: true, razao_social: true, nome_fantasia: true },
          },
        },
        orderBy: { criado_em: 'desc' },
      });
      return data.map((p) =>
        this.aplicarMarkupProduto(p, ctx?.aplicarMarkup100),
      );
    }

    const page = Math.max(1, Number(opts.page || 1));
    const pageSize = Math.max(1, Number(opts.pageSize || 20));

    const total = await this.prisma.produtos.count({ where });
    const data = await this.prisma.produtos.findMany({
      where,
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true },
        },
      },
      orderBy: [{ nome_produto: 'asc' }, { criado_em: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: data.map((p) =>
        this.aplicarMarkupProduto(p, ctx?.aplicarMarkup100),
      ),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        exibeMarkupLoja: !!ctx?.aplicarMarkup100,
      },
    };
  }

  async buscar(
    filtros: {
      nome_produto?: string;
      marca?: string;
      cor?: string;
      medida?: string;
      fornecedor_id?: number;
      categoria_base?: string;
    },
    ctx?: { aplicarMarkup100?: boolean },
  ) {
    const where: any = { status: 'ATIVO' };

    // suportar paginação via objeto filtros.page, filtros.pageSize (opcional)
    const page = filtros['page'] ? Number(filtros['page']) : undefined;
    const pageSize = filtros['pageSize']
      ? Number(filtros['pageSize'])
      : undefined;

    if (filtros.nome_produto) {
      where.nome_produto = {
        contains: filtros.nome_produto,
        mode: 'insensitive',
      };
    }

    if (filtros.marca) {
      where.marca = {
        contains: filtros.marca,
        mode: 'insensitive',
      };
    }

    if (filtros.cor) {
      where.cor = {
        contains: filtros.cor,
        mode: 'insensitive',
      };
    }

    if (filtros.medida) {
      where.medida = {
        contains: filtros.medida,
        mode: 'insensitive',
      };
    }

    if (filtros.fornecedor_id) {
      where.fornecedor_id = filtros.fornecedor_id;
    }

    if (filtros.categoria_base) {
      this.aplicarFiltroCategoriaBaseComLegado(where, filtros.categoria_base);
    }

    if (!page) {
      const data = await this.prisma.produtos.findMany({
        where,
        include: {
          fornecedor: {
            select: { id: true, razao_social: true, nome_fantasia: true },
          },
        },
        orderBy: [{ nome_produto: 'asc' }, { criado_em: 'desc' }],
      });
      return data.map((p) =>
        this.aplicarMarkupProduto(p, ctx?.aplicarMarkup100),
      );
    }

    const total = await this.prisma.produtos.count({ where });
    const data = await this.prisma.produtos.findMany({
      where,
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true },
        },
      },
      orderBy: [{ nome_produto: 'asc' }, { criado_em: 'desc' }],
      skip: (Math.max(1, page) - 1) * Math.max(1, pageSize || 20),
      take: Math.max(1, pageSize || 20),
    });

    return {
      data: data.map((p) =>
        this.aplicarMarkupProduto(p, ctx?.aplicarMarkup100),
      ),
      meta: {
        page: Math.max(1, page),
        pageSize: Math.max(1, pageSize || 20),
        total,
        totalPages: Math.ceil(total / Math.max(1, pageSize || 20)),
        exibeMarkupLoja: !!ctx?.aplicarMarkup100,
      },
    };
  }

  /**
   * Lista produtos com estoque atual abaixo do estoque mínimo (para sugestão de compra).
   * Filtro: quantidade < estoque_minimo (e estoque_minimo > 0).
   */
  async listarAbaixoEstoqueMinimo(ctx?: { aplicarMarkup100?: boolean }) {
    const data = await this.prisma.produtos.findMany({
      where: { status: 'ATIVO' },
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true },
        },
      },
      orderBy: [{ nome_produto: 'asc' }],
    });
    const filtrados = data.filter((p) => {
      const qtd = Number(p.quantidade ?? 0);
      const min = Number(p.estoque_minimo ?? 0);
      return min > 0 && qtd < min;
    });
    return filtrados.map((p) =>
      this.aplicarMarkupProduto(p, ctx?.aplicarMarkup100),
    );
  }

  async buscarPorId(id: number, ctx?: { aplicarMarkup100?: boolean }) {
    const produto = await this.prisma.produtos.findUnique({
      where: { id },
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true },
        },
      },
    });
    if (!produto) throw new NotFoundException('Produto não encontrado');

    const fitaVinculadaId = Number((produto as any).fita_vinculada_id ?? 0);
    let fita_vinculada: any = null;

    if (fitaVinculadaId > 0) {
      fita_vinculada = await (this.prisma as any).produtos.findUnique({
        where: { id: fitaVinculadaId },
        select: {
          id: true,
          nome_produto: true,
          cor: true,
          medida: true,
          categoria_base: true,
          metragem_rolo_m: true,
          valor_unitario: true,
          status: true,
        },
      });
    }

    return this.aplicarMarkupProduto(
      {
        ...produto,
        fita_vinculada,
      },
      ctx?.aplicarMarkup100,
    );
  }

  async atualizar(id: number, dto: UpdateProdutoDto) {
    const atual = await this.buscarPorId(id);
    const atualAny = atual as any;

    const fornecedor_id =
      dto.fornecedor_id === undefined
        ? atual.fornecedor_id
        : Number(dto.fornecedor_id);
    if (!fornecedor_id)
      throw new BadRequestException('fornecedor_id é obrigatório.');

    const nome_produto =
      dto.nome_produto === undefined
        ? atual.nome_produto
        : String(dto.nome_produto ?? '').trim();

    const marca =
      dto.marca === undefined ? (atual.marca ?? null) : this.normStr(dto.marca);

    const cor =
      dto.cor === undefined ? (atual.cor ?? null) : this.normStr(dto.cor);

    const categoria_base = this.normalizeCategoriaBase(
      (dto as any).categoria_base === undefined
        ? atualAny.categoria_base ?? null
        : this.normStr((dto as any).categoria_base),
    );

    const metragem_rolo_m =
      (dto as any).metragem_rolo_m === undefined
        ? this.normalizeMetragemRolo(atualAny.metragem_rolo_m, categoria_base)
        : this.normalizeMetragemRolo((dto as any).metragem_rolo_m, categoria_base);

    if (this.isCategoriaFitaBorda(categoria_base) && (metragem_rolo_m == null || metragem_rolo_m <= 0)) {
      throw new BadRequestException('Metragem do rolo é obrigatória para produtos da categoria Fita de Borda.');
    }

    const medidaBase =
      dto.medida === undefined
        ? (this.isCategoriaFitaBorda(atualAny.categoria_base) && !this.isCategoriaFitaBorda(categoria_base)
            ? null
            : (atual.medida ?? null))
        : this.normStr(dto.medida);

    const medida = this.resolveMedidaProduto(medidaBase, categoria_base, metragem_rolo_m);

    const largura_mm =
      dto.largura_mm === undefined
        ? atual.largura_mm
        : dto.largura_mm === null
          ? null
          : Number(dto.largura_mm);

    const comprimento_mm =
      dto.comprimento_mm === undefined
        ? atual.comprimento_mm
        : dto.comprimento_mm === null
          ? null
          : Number(dto.comprimento_mm);

    const espessura_mm =
      dto.espessura_mm === undefined
        ? atual.espessura_mm
        : dto.espessura_mm === null
          ? null
          : Number(dto.espessura_mm);

    const preco_m2 =
      dto.preco_m2 === undefined
        ? atual.preco_m2
        : dto.preco_m2 === null
          ? null
          : Number(dto.preco_m2);

    const adicional_fita_m2_informado =
      (dto as any).adicional_fita_m2 === undefined
        ? (atualAny.adicional_fita_m2 ?? null)
        : (dto as any).adicional_fita_m2 === null
          ? null
          : Number((dto as any).adicional_fita_m2);

    const fitaVinculada = await this.resolveFitaVinculada(
      (dto as any).fita_vinculada_id === undefined
        ? atualAny.fita_vinculada_id
        : (dto as any).fita_vinculada_id,
      categoria_base,
    );

    const adicional_fita_m2 =
      fitaVinculada.adicional_fita_m2 ?? adicional_fita_m2_informado;

    await this.checarDuplicado({
      fornecedor_id,
      nome_produto,
      marca,
      cor,
      medida,
      ignorarId: id,
    });

    const unidade =
      dto.unidade === undefined ? atual.unidade : this.normStr(dto.unidade);
    const unidade_compra =
      (dto as any).unidade_compra === undefined
        ? ((atual as any).unidade_compra ?? unidade)
        : this.normStr((dto as any).unidade_compra);
    const unidade_consumo =
      (dto as any).unidade_consumo === undefined
        ? ((atual as any).unidade_consumo ?? (atual as any).insumo_unidade_referencia ?? null)
        : this.normStr((dto as any).unidade_consumo);

    const insumo_fator_conversao =
      (dto as any).insumo_fator_conversao === undefined
        ? this.normalizeInsumoFatorConversao(
            (atual as any).insumo_fator_conversao,
            unidade_compra,
            categoria_base,
          )
        : this.normalizeInsumoFatorConversao(
            (dto as any).insumo_fator_conversao ?? (dto as any).fator_conversao,
            unidade_compra,
            categoria_base,
          );

    const fator_conversao =
      (dto as any).fator_conversao === undefined
        ? this.normalizeFatorConversao(
            (atual as any).fator_conversao ?? (atual as any).insumo_fator_conversao,
            unidade_compra,
            categoria_base,
          )
        : this.normalizeFatorConversao(
            (dto as any).fator_conversao ?? (dto as any).insumo_fator_conversao,
            unidade_compra,
            categoria_base,
          );

    const insumo_unidade_referencia =
      (dto as any).insumo_unidade_referencia === undefined
        ? this.normalizeInsumoUnidadeReferencia(
            (atual as any).insumo_unidade_referencia ?? unidade_consumo,
            unidade_compra,
            categoria_base,
          )
        : this.normalizeInsumoUnidadeReferencia(
            (dto as any).insumo_unidade_referencia ?? (dto as any).unidade_consumo,
            unidade_compra,
            categoria_base,
          );
    const insumo_consumo_m2 =
      (dto as any).insumo_consumo_m2 === undefined
        ? this.normalizeInsumoConsumoM2(
            (atual as any).insumo_consumo_m2,
            categoria_base,
          )
        : this.normalizeInsumoConsumoM2(
            (dto as any).insumo_consumo_m2,
            categoria_base,
          );

    const valor_unitario =
      dto.valor_unitario === undefined
        ? Number(atual.valor_unitario)
        : Number(dto.valor_unitario);
    const custo_unitario_real = this.calcCustoUnitarioReal(valor_unitario, fator_conversao);

    const updateData = {
      fornecedor: { connect: { id: fornecedor_id } },
      nome_produto,
      marca,
      cor,
      unidade,
      unidade_compra,
      unidade_consumo,
      medida,
      largura_mm,
      comprimento_mm,
      espessura_mm,
      metragem_rolo_m,
      preco_m2,
      adicional_fita_m2,
      quantidade:
        dto.quantidade === undefined
          ? atual.quantidade
          : Number(dto.quantidade),
      estoque_minimo:
        dto.estoque_minimo === undefined
          ? (atual as any).estoque_minimo ?? 0
          : Number(dto.estoque_minimo),
      categoria_base,
      fita_vinculada_id: fitaVinculada.fita_vinculada_id,
      categoria_ferragem:
        (dto as any).categoria_ferragem === undefined
          ? ((atual as any).categoria_ferragem ?? null)
          : (this.normStr((dto as any).categoria_ferragem) ?? null),
      fator_conversao,
      insumo_fator_conversao,
      insumo_unidade_referencia,
      insumo_consumo_m2,
      valor_unitario,
      custo_unitario_real,
      valor_total:
        dto.valor_total === undefined
          ? Number(atual.valor_total)
          : Number(dto.valor_total),
      imagem_url:
        dto.imagem_url === undefined
          ? atual.imagem_url
          : this.normStr(dto.imagem_url),
      status: dto.status === undefined ? atual.status : dto.status,
    };
    return this.prisma.produtos.update({ where: { id }, data: updateData as any });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    try {
      return await this.prisma.produtos.delete({ where: { id } });
    } catch (e: any) {
      throw new BadRequestException(
        'Não é possível excluir: produto está em uso (compras/serviço de corte).',
      );
    }
  }
}
