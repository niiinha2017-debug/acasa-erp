import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePlanoCorteConsumoDto } from './dto/create-plano-corte-consumo.dto'

@Injectable()
export class PlanoCorteConsumosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePlanoCorteConsumoDto) {
    return this.prisma.plano_corte_consumo.create({ data: dto })
  }
}
