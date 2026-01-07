import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePlanoCorteItemDto } from './dto/create-plano-corte-iten.dto'
import { UpdatePlanoCorteItemDto } from './dto/update-plano-corte-iten.dto'

@Injectable()
export class PlanoCorteItensService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePlanoCorteItemDto) {
    return this.prisma.plano_corte_item.create({ data: dto })
  }

  findAll(fornecedor_id?: number) {
    return this.prisma.plano_corte_item.findMany({
      where: fornecedor_id ? { fornecedor_id } : {},
      orderBy: { nome: 'asc' },
    })
  }

  update(id: number, dto: UpdatePlanoCorteItemDto) {
    return this.prisma.plano_corte_item.update({
      where: { id },
      data: dto,
    })
  }

  remove(id: number) {
    return this.prisma.plano_corte_item.delete({ where: { id } })
  }
}
