import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateProdutoDto } from './dto/criar-produto.dto'
import { UpdateProdutoDto } from './dto/atualizar-produto.dto'

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  async criar(dto: CreateProdutoDto) {
    return this.prisma.produtos.create({
      data: {
        fornecedor_id: dto.fornecedor_id,
        nome_produto: dto.nome_produto,
        cor: dto.cor ?? null,
        medida: dto.medida ?? null,
        quantidade: dto.quantidade,
        valor_unitario: dto.valor_unitario,
        valor_total: dto.valor_total,
        status: dto.status,
      },
    })
  }

  async listar() {
    return this.prisma.produtos.findMany({
      include: {
        fornecedor: {
          select: {
            id: true,
            razao_social: true,
            nome_fantasia: true,
          },
        },
      },
      orderBy: {
        criado_em: 'desc',
      },
    })
  }

  async buscarPorId(id: number) {
    const produto = await this.prisma.produtos.findUnique({
      where: { id },
      include: {
        fornecedor: {
          select: {
            id: true,
            razao_social: true,
            nome_fantasia: true,
          },
        },
      },
    })

    if (!produto) {
      throw new NotFoundException('Produto não encontrado')
    }

    return produto
  }

  async atualizar(id: number, dto: UpdateProdutoDto) {
    await this.buscarPorId(id)

    return this.prisma.produtos.update({
      where: { id },
      data: {
        ...dto,
      },
    })
  }

  async remover(id: number) {
    await this.buscarPorId(id)

    return this.prisma.produtos.delete({
      where: { id },
    })
  }
}
