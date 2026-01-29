import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto'

@Injectable()
export class PlanoCorteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanoCorteDto) {
    return this.prisma.$transaction(async (tx) => {
      // soma com Decimal (evita ruído de float)
      const total = dto.produtos.reduce(
        (acc, p) => acc.plus(new Prisma.Decimal(p.valor_total || 0)),
        new Prisma.Decimal(0),
      )

      const plano = await tx.plano_corte.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: new Date(dto.data_venda),
          status: dto.status,
          valor_total: total,
        },
      })

      for (const p of dto.produtos) {
        await tx.plano_corte_produto.create({
          data: {
            plano_corte_id: plano.id,
            item_id: p.item_id,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.valor_total,
            status: p.status,
          },
        })

        // atualiza histórico do item vendido (campos já existem no schema)
        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: new Date(dto.data_venda),
          },
        })
      }

      // opcional: devolver já completo (pra front não ter que refetch)
      return tx.plano_corte.findUnique({
        where: { id: plano.id },
        include: {
          fornecedor: true,
          produtos: { include: { item: true } },
          consumos: { include: { produto: true } },
        },
      })
    })
  }

  async findAll() {
    return this.prisma.plano_corte.findMany({
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
      orderBy: { data_venda: 'desc' },
    })
  }

  async findOne(id: number) {
    const plano = await this.prisma.plano_corte.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
    })

    if (!plano) throw new NotFoundException(`Plano de Corte #${id} não encontrado.`)
    return plano
  }

async update(id: number, dto: UpdatePlanoCorteDto) {
  await this.findOne(id)

  return this.prisma.$transaction(async (tx) => {
    // se veio produtos, refaz tudo
    if (dto.produtos) {
      const total = dto.produtos.reduce(
        (acc, p) => acc.plus(new Prisma.Decimal(p.valor_total || 0)),
        new Prisma.Decimal(0),
      )

      // atualiza cabeçalho
      await tx.plano_corte.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          status: dto.status,
          valor_total: total,
        },
      })

      // refaz linhas (permite duplicados)
      await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } })

      for (const p of dto.produtos) {
        await tx.plano_corte_produto.create({
          data: {
            plano_corte_id: id,
            item_id: p.item_id,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.valor_total,
            status: p.status,
          },
        })

        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: dto.data_venda ? new Date(dto.data_venda) : new Date(),
          },
        })
      }
    } else {
      // update simples sem mexer nos produtos
      await tx.plano_corte.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          status: dto.status,
        },
      })
    }

    return tx.plano_corte.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
    })
  })
}


async enviarParaProducao(id: number) {
  throw new BadRequestException('Status do Plano de Corte é controlado pela Agenda, não por esta ação.')
}



  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.$transaction(async (tx) => {
      // garante remoção sem depender de cascata
      await tx.plano_corte_consumo.deleteMany({ where: { plano_corte_id: id } })
      await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } })
      await tx.plano_corte.delete({ where: { id } })
      return { ok: true }
    })
  }
}
