import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, despesas } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDespesaDto } from './dto/create-despesa.dto'
import { UpdateDespesaDto } from './dto/update-despesa.dto'

@Injectable()
export class DespesasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDespesaDto): Promise<despesas> {
    return this.prisma.despesas.create({
      data: {
        tipo_movimento: dto.tipo_movimento,
        categoria: dto.categoria,
        classificacao: dto.classificacao,
        local: dto.local,
        valor_total: new Prisma.Decimal(dto.valor_total),
        forma_pagamento: dto.forma_pagamento,
        quantidade_parcelas: dto.quantidade_parcelas,
        data_registro: dto.data_registro
          ? new Date(dto.data_registro)
          : undefined,
        data_vencimento: new Date(dto.data_vencimento),
        data_pagamento: dto.data_pagamento
          ? new Date(dto.data_pagamento)
          : null,
        funcionario_id: dto.funcionario_id ?? null,
        status: dto.status,
      },
    })
  }

  async findAll(): Promise<despesas[]> {
    return this.prisma.despesas.findMany({
      orderBy: { data_registro: 'desc' },
    })
  }

  async findOne(id: number): Promise<despesas> {
    const despesa = await this.prisma.despesas.findUnique({
      where: { id },
    })

    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada')
    }

    return despesa
  }

  async update(
    id: number,
    dto: UpdateDespesaDto,
  ): Promise<despesas> {
    await this.findOne(id)

    const data: Prisma.despesasUpdateInput = {
      ...dto,
    }

    if (dto.valor_total !== undefined) {
      data.valor_total = new Prisma.Decimal(dto.valor_total)
    }

    if (dto.data_registro !== undefined) {
      data.data_registro = dto.data_registro
        ? new Date(dto.data_registro)
        : undefined
    }

    if (dto.data_vencimento !== undefined) {
      data.data_vencimento = dto.data_vencimento
        ? new Date(dto.data_vencimento)
        : undefined
    }

    if (dto.data_pagamento !== undefined) {
      data.data_pagamento = dto.data_pagamento
        ? new Date(dto.data_pagamento)
        : null
    }

    return this.prisma.despesas.update({
      where: { id },
      data,
    })
  }

  async remove(id: number): Promise<despesas> {
    await this.findOne(id)

    return this.prisma.despesas.delete({
      where: { id },
    })
  }
}
