import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePlanoCorteConsumoDto } from './dto/create-plano-corte-consumo.dto'

@Injectable()
export class PlanoCorteConsumosService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlanoCorteConsumoDto) {
    // Adicionamos o 'async' para garantir o tratamento correto da Promise
    return this.prisma.plano_corte_consumo.create({ 
      data: dto 
    })
  }

  async findAll() {
    return this.prisma.plano_corte_consumo.findMany({
      include: {
        produto: true, // Inclui os dados do produto consumido para o Front
      },
      orderBy: { id: 'desc' }
    })
  }

  async findOne(id: number) {
    const consumo = await this.prisma.plano_corte_consumo.findUnique({
      where: { id },
      include: { produto: true }
    })

    if (!consumo) {
      throw new NotFoundException(`Consumo #${id} não encontrado.`)
    }

    return consumo
  }

  async remove(id: number) {
    // Primeiro validamos se o registro existe
    await this.findOne(id)

    return this.prisma.plano_corte_consumo.delete({
      where: { id }
    })
  }
}