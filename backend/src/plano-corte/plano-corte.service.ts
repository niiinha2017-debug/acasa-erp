import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePlanoCorteDto } from './dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from './dto/update-plano-corte.dto'

@Injectable()
export class PlanoCorteService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlanoCorteDto) {
    return this.prisma.$transaction(async (tx) => {
      const plano = await tx.plano_corte.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: new Date(dto.data_venda),
          status: dto.status,
          valor_total: dto.produtos.reduce((t, p) => t + p.valor_total, 0),
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
      }

      return plano
    })
  }

  findAll() {
    return this.prisma.plano_corte.findMany({
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
      orderBy: { data_venda: 'desc' },
    })
  }

  // --- MÉTODOS ADICIONADOS PARA CURAR O ERRO DO CONTROLLER ---

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
    // Verifica se existe antes de tentar atualizar
    await this.findOne(id)

    return this.prisma.plano_corte.update({
      where: { id },
      data: {
        fornecedor_id: dto.fornecedor_id,
        data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
        status: dto.status,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)
    
    // O Prisma deletará os produtos em cascata se configurado no schema, 
    // caso contrário, precisamos deletar manualmente antes do plano.
    return this.prisma.plano_corte.delete({
      where: { id },
    })
  }
}