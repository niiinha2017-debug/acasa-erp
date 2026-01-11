import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProdutoDto } from './dto/criar-produto.dto'
import { UpdateProdutoDto } from './dto/atualizar-produto.dto'

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  private normStr(v: any) {
    const s = String(v ?? '').trim()
    return s.length ? s : null
  }

  private async checarDuplicado(params: {
    fornecedor_id: number
    nome_produto: string
    marca: string | null
    cor: string | null
    ignorarId?: number
  }) {
    const dup = await this.prisma.produtos.findFirst({
      where: {
        fornecedor_id: params.fornecedor_id,
        nome_produto: params.nome_produto,
        marca: params.marca,
        cor: params.cor,
        ...(params.ignorarId ? { id: { not: params.ignorarId } } : {}),
      },
      select: { id: true },
    })

    if (dup) {
      throw new BadRequestException(
        `Produto já cadastrado para este fornecedor (duplicado). ID: ${dup.id}`,
      )
    }
  }

  async criar(dto: CreateProdutoDto) {
    const fornecedor_id = Number(dto.fornecedor_id)
    if (!fornecedor_id) throw new BadRequestException('fornecedor_id é obrigatório.')

    const nome_produto = String(dto.nome_produto ?? '').trim()
    if (!nome_produto) throw new BadRequestException('nome_produto é obrigatório.')

    const marca = this.normStr(dto.marca)
    const cor = this.normStr(dto.cor)

    // ✅ BLOQUEIO DUPLICADO
    await this.checarDuplicado({ fornecedor_id, nome_produto, marca, cor })

    return this.prisma.produtos.create({
      data: {
        fornecedor_id,
        nome_produto,
        marca,
        cor,
        unidade: this.normStr(dto.unidade),
        medida: this.normStr(dto.medida),
        quantidade: Number(dto.quantidade ?? 0),
        valor_unitario: dto.valor_unitario,
        valor_total: dto.valor_total,
        status: dto.status ?? 'ATIVO',
      },
    })
  }

  async listar(filtro?: { fornecedor_id?: number }) {
    const where: any = {}
    if (filtro?.fornecedor_id) where.fornecedor_id = filtro.fornecedor_id

    return this.prisma.produtos.findMany({
      where,
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true },
        },
      },
      orderBy: { criado_em: 'desc' },
    })
  }

  async buscarPorId(id: number) {
    const produto = await this.prisma.produtos.findUnique({
      where: { id },
      include: {
        fornecedor: { select: { id: true, razao_social: true, nome_fantasia: true } },
      },
    })
    if (!produto) throw new NotFoundException('Produto não encontrado')
    return produto
  }

  async atualizar(id: number, dto: UpdateProdutoDto) {
    const atual = await this.buscarPorId(id)

    const fornecedor_id =
      dto.fornecedor_id === undefined ? atual.fornecedor_id : Number(dto.fornecedor_id)

    const nome_produto =
      dto.nome_produto === undefined ? atual.nome_produto : String(dto.nome_produto ?? '').trim()

    const marca =
      dto.marca === undefined ? (atual.marca ?? null) : this.normStr(dto.marca)

    const cor =
      dto.cor === undefined ? (atual.cor ?? null) : this.normStr(dto.cor)

    // ✅ BLOQUEIO DUPLICADO (na atualização também)
    await this.checarDuplicado({
      fornecedor_id,
      nome_produto,
      marca,
      cor,
      ignorarId: id,
    })

    return this.prisma.produtos.update({
      where: { id },
      data: {
        ...dto,
        fornecedor_id,
        nome_produto,
        marca,
        cor,
      },
    })
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    return this.prisma.produtos.delete({ where: { id } })
  }
}
