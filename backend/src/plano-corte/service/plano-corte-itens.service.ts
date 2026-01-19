import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePlanoCorteItemDto } from '../dto/create-plano-corte-iten.dto'
import { UpdatePlanoCorteItemDto } from '../dto/update-plano-corte-iten.dto'

@Injectable()
export class PlanoCorteItensService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(fornecedor_id?: number) {
    return this.prisma.plano_corte_item.findMany({
      where: fornecedor_id ? { fornecedor_id } : {},
      orderBy: { nome_produto: 'asc' },
    })
  }

  async buscar(id: number) {
    const item = await this.prisma.plano_corte_item.findUnique({ where: { id } })
    if (!item) throw new NotFoundException(`Item #${id} não encontrado.`)
    return item
  }

  async criar(dto: CreatePlanoCorteItemDto) {
    try {
      return await this.prisma.plano_corte_item.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          nome_produto: dto.nome_produto,
          marca: dto.marca ?? null,
          cor: dto.cor ?? null,
          medida: dto.medida ?? null,
          unidade: dto.unidade ?? null,
          quantidade: dto.quantidade,
          valor_unitario: dto.valor_unitario,
          valor_total: dto.valor_total,
          status: dto.status,
        },
      })
    } catch (e: any) {
      // se você tiver algum unique no futuro
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Item já cadastrado.')
      }
      throw e
    }
  }

  async atualizar(id: number, dto: UpdatePlanoCorteItemDto) {
    await this.buscar(id)

    try {
      return await this.prisma.plano_corte_item.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          nome_produto: dto.nome_produto,
          marca: dto.marca,
          cor: dto.cor,
          medida: dto.medida,
          unidade: dto.unidade,
          quantidade: dto.quantidade,
          valor_unitario: dto.valor_unitario,
          valor_total: dto.valor_total,
          status: dto.status,
        },
      })
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Item já cadastrado.')
      }
      throw e
    }
  }

  async remover(id: number) {
    await this.buscar(id)
    await this.prisma.plano_corte_item.delete({ where: { id } })
    return { ok: true }
  }
}
