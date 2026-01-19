import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePlanoCorteConsumoDto } from '../dto/create-plano-corte-consumo.dto'
import { UpdatePlanoCorteConsumoDto } from '../dto/update-plano-corte-consumo.dto'

@Injectable()
export class PlanoCorteConsumosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.plano_corte_consumo.findMany({
      include: { produto: true },
      orderBy: { id: 'desc' },
    })
  }

  async buscar(id: number) {
    const consumo = await this.prisma.plano_corte_consumo.findUnique({
      where: { id },
      include: { produto: true },
    })

    if (!consumo) throw new NotFoundException(`Consumo #${id} não encontrado.`)
    return consumo
  }

  async criar(dto: CreatePlanoCorteConsumoDto) {
    return this.prisma.plano_corte_consumo.create({
      data: {
        plano_corte_id: dto.plano_corte_id,
        produto_id: dto.produto_id,
        quantidade: dto.quantidade,
      },
      include: { produto: true },
    })
  }

  async atualizar(id: number, dto: UpdatePlanoCorteConsumoDto) {
    await this.buscar(id)

    return this.prisma.plano_corte_consumo.update({
      where: { id },
      data: {
        plano_corte_id: dto.plano_corte_id,
        produto_id: dto.produto_id,
        quantidade: dto.quantidade,
      },
      include: { produto: true },
    })
  }

  async remover(id: number) {
    await this.buscar(id)
    await this.prisma.plano_corte_consumo.delete({ where: { id } })
    return { ok: true }
  }
}
