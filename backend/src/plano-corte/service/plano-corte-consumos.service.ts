import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProdutosService } from '../../produtos/produtos.service';
import { CreatePlanoCorteConsumoDto } from '../dto/create-plano-corte-consumo.dto';
import { UpdatePlanoCorteConsumoDto } from '../dto/update-plano-corte-consumo.dto';

@Injectable()
export class PlanoCorteConsumosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly produtosService: ProdutosService,
  ) {}

  private toNum(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private async aplicarMovimentoEstoque(
    tx: any,
    produtoId: number,
    deltaQuantidade: number,
  ) {
    const delta = this.toNum(deltaQuantidade);
    if (!produtoId || delta === 0) return;

    const produto = await tx.produtos.findUnique({
      where: { id: produtoId },
      select: { id: true, quantidade: true },
    });

    if (!produto) {
      throw new NotFoundException(`Produto #${produtoId} não encontrado para movimentação de estoque.`);
    }

    const quantidadeAtual = this.toNum(produto.quantidade);
    const quantidadeFinal = quantidadeAtual + delta;
    if (quantidadeFinal < 0) {
      throw new NotFoundException(
        `Estoque insuficiente para produto #${produtoId}. Atual: ${quantidadeAtual}, necessário: ${Math.abs(delta)}.`,
      );
    }

    await tx.produtos.update({
      where: { id: produtoId },
      data: {
        quantidade: delta > 0 ? { increment: delta } : { decrement: Math.abs(delta) },
        atualizado_em: new Date(),
      },
    });
  }

  async listar(opts?: { page?: number; pageSize?: number }) {
    if (!opts || !opts.page) {
      return this.prisma.plano_corte_consumo.findMany({
        include: { produto: true },
        orderBy: { id: 'desc' },
      });
    }

    const page = Math.max(1, Number(opts.page || 1));
    const pageSize = Math.max(1, Number(opts.pageSize || 20));

    const where: any = {};
    const total = await this.prisma.plano_corte_consumo.count({ where });
    const data = await this.prisma.plano_corte_consumo.findMany({
      where,
      include: { produto: true },
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async buscarProdutosParaConsumo(filtros: {
    nome_produto?: string;
    marca?: string;
    cor?: string;
    medida?: string;
    fornecedor_id?: number;
  }) {
    return this.produtosService.buscar(filtros);
  }

  async buscar(id: number) {
    const consumo = await this.prisma.plano_corte_consumo.findUnique({
      where: { id },
      include: { produto: true },
    });

    if (!consumo) throw new NotFoundException(`Consumo #${id} não encontrado.`);
    return consumo;
  }

  async criar(dto: CreatePlanoCorteConsumoDto) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.plano_corte_consumo.create({
        data: {
          plano_corte_id: dto.plano_corte_id,
          produto_id: dto.produto_id,
          quantidade: dto.quantidade,
        },
        include: { produto: true },
      });

      // Consumo de insumo baixa estoque do produto.
      await this.aplicarMovimentoEstoque(tx, dto.produto_id, -this.toNum(dto.quantidade));

      return created;
    });
  }

  async atualizar(id: number, dto: UpdatePlanoCorteConsumoDto) {
    return this.prisma.$transaction(async (tx) => {
      const atual = await tx.plano_corte_consumo.findUnique({
        where: { id },
      });

      if (!atual) {
        throw new NotFoundException(`Consumo #${id} não encontrado.`);
      }

      const novoProdutoId = Number(dto.produto_id ?? atual.produto_id);
      const novaQuantidade = this.toNum(dto.quantidade ?? atual.quantidade);

      const produtoMudou = novoProdutoId !== Number(atual.produto_id);

      if (produtoMudou) {
        // Estorna consumo antigo no produto antigo...
        await this.aplicarMovimentoEstoque(tx, Number(atual.produto_id), this.toNum(atual.quantidade));
        // ...e aplica baixa total no novo produto.
        await this.aplicarMovimentoEstoque(tx, novoProdutoId, -novaQuantidade);
      } else {
        // Delta > 0: aumenta consumo (baixa mais). Delta < 0: reduz consumo (devolve estoque).
        const deltaConsumo = novaQuantidade - this.toNum(atual.quantidade);
        await this.aplicarMovimentoEstoque(tx, novoProdutoId, -deltaConsumo);
      }

      return tx.plano_corte_consumo.update({
        where: { id },
        data: {
          plano_corte_id: dto.plano_corte_id,
          produto_id: dto.produto_id,
          quantidade: dto.quantidade,
        },
        include: { produto: true },
      });
    });
  }

  async remover(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const atual = await tx.plano_corte_consumo.findUnique({ where: { id } });
      if (!atual) throw new NotFoundException(`Consumo #${id} não encontrado.`);

      // Ao remover consumo, devolve quantidade para o estoque.
      await this.aplicarMovimentoEstoque(tx, Number(atual.produto_id), this.toNum(atual.quantidade));

      await tx.plano_corte_consumo.delete({ where: { id } });
      return { ok: true };
    });
  }
}
