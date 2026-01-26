import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma, despesas } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDespesaDto } from './dto/create-despesa.dto'
import { UpdateDespesaDto } from './dto/update-despesa.dto'
import { randomUUID } from 'crypto'

type FiltrosDespesas = {
  status?: string
  unidade?: string
  tipo_movimento?: string
}

@Injectable()
export class DespesasService {
  constructor(private readonly prisma: PrismaService) {}

  private addMeses(date: Date, meses: number) {
    const d = new Date(date)
    d.setMonth(d.getMonth() + meses)
    return d
  }

 async create(dto: CreateDespesaDto): Promise<despesas[]> {
  // parcelas
  let parcelas = Number(dto.quantidade_parcelas ?? 1)
  if (!Number.isFinite(parcelas) || parcelas < 1) parcelas = 1

  // datas
  const primeiroVenc = new Date(dto.data_vencimento)
  if (isNaN(primeiroVenc.getTime())) {
    throw new BadRequestException('data_vencimento inválida')
  }

  const dataRegistro = dto.data_registro ? new Date(dto.data_registro) : undefined
  if (dto.data_registro && isNaN(dataRegistro!.getTime())) {
    throw new BadRequestException('data_registro inválida')
  }

  const dataPagamento = dto.data_pagamento ? new Date(dto.data_pagamento) : null
  if (dto.data_pagamento && isNaN(dataPagamento!.getTime())) {
    throw new BadRequestException('data_pagamento inválida')
  }

  // recorrência (gerada automaticamente quando parcelado)
  const recorrenciaId = parcelas > 1 ? randomUUID() : null

  // funcionario opcional
  const funcionarioId =
    dto.funcionario_id === null || dto.funcionario_id === undefined
      ? null
      : Number(dto.funcionario_id)

  // base
  const baseData: Prisma.despesasCreateInput = {
    tipo_movimento: dto.tipo_movimento,
    unidade: dto.unidade,
    categoria: dto.categoria,
    classificacao: dto.classificacao,
    local: dto.local ?? '',

    valor_total: new Prisma.Decimal(dto.valor_total),
    forma_pagamento: dto.forma_pagamento,
    quantidade_parcelas: parcelas,

    data_registro: dataRegistro ?? new Date(),
    data_vencimento: primeiroVenc,

    status: dto.status,
    recorrencia_id: recorrenciaId,

    ...(funcionarioId ? { funcionario: { connect: { id: funcionarioId } } } : {}),
  }

  // cria parcelas
  const criadas = await this.prisma.$transaction(
    Array.from({ length: parcelas }).map((_, i) =>
      this.prisma.despesas.create({
        data: {
          ...baseData,
          parcela_numero: parcelas > 1 ? i + 1 : null,
          data_vencimento: this.addMeses(primeiroVenc, i),
          data_pagamento: i === 0 ? dataPagamento : null,
        },
      }),
    ),
  )

  return criadas
}


  async findAll(filtros: FiltrosDespesas = {}): Promise<despesas[]> {
    return this.prisma.despesas.findMany({
      where: {
        status: filtros.status || undefined,
        unidade: filtros.unidade || undefined,
        tipo_movimento: filtros.tipo_movimento || undefined,
      },
      orderBy: { data_registro: 'desc' },
    })
  }

  async findOne(id: number): Promise<despesas> {
    const despesa = await this.prisma.despesas.findUnique({ where: { id } })
    if (!despesa) throw new NotFoundException('Despesa não encontrada')
    return despesa
  }

async update(id: number, dto: UpdateDespesaDto): Promise<despesas> {
  await this.findOne(id)

  const data: Prisma.despesasUpdateInput = {}

  if (dto.tipo_movimento !== undefined) data.tipo_movimento = dto.tipo_movimento
  if (dto.unidade !== undefined) data.unidade = dto.unidade
  if (dto.categoria !== undefined) data.categoria = dto.categoria
  if (dto.classificacao !== undefined) data.classificacao = dto.classificacao
  if (dto.local !== undefined) data.local = dto.local
  if (dto.forma_pagamento !== undefined) data.forma_pagamento = dto.forma_pagamento
  if (dto.status !== undefined) data.status = dto.status

  if (dto.quantidade_parcelas !== undefined) {
    const parcelas = Number(dto.quantidade_parcelas)
    if (!Number.isFinite(parcelas) || parcelas < 1) {
      throw new BadRequestException('quantidade_parcelas inválida')
    }
    data.quantidade_parcelas = parcelas
  }

  if (dto.valor_total !== undefined) {
    data.valor_total = new Prisma.Decimal(dto.valor_total)
  }

  if (dto.data_registro !== undefined) {
    if (dto.data_registro && isNaN(new Date(dto.data_registro).getTime())) {
      throw new BadRequestException('data_registro inválida')
    }
    data.data_registro = dto.data_registro ? new Date(dto.data_registro) : undefined
  }

  if (dto.data_vencimento !== undefined) {
    if (dto.data_vencimento && isNaN(new Date(dto.data_vencimento).getTime())) {
      throw new BadRequestException('data_vencimento inválida')
    }
    data.data_vencimento = dto.data_vencimento ? new Date(dto.data_vencimento) : undefined
  }

  if (dto.data_pagamento !== undefined) {
    if (dto.data_pagamento && isNaN(new Date(dto.data_pagamento).getTime())) {
      throw new BadRequestException('data_pagamento inválida')
    }
    data.data_pagamento = dto.data_pagamento ? new Date(dto.data_pagamento) : null
  }

  // ✅ funcionário opcional (blindado)
  if (dto.funcionario_id !== undefined) {
    const funcionarioId =
      dto.funcionario_id === null || dto.funcionario_id === undefined
        ? null
        : Number(dto.funcionario_id)

    data.funcionario = funcionarioId
      ? { connect: { id: funcionarioId } }
      : { disconnect: true }
  }

  return this.prisma.despesas.update({ where: { id }, data })
}

async updateRecorrencia(recorrenciaId: string, dto: UpdateDespesaDto): Promise<number> {
  const existe = await this.prisma.despesas.findFirst({
    where: { recorrencia_id: recorrenciaId },
    select: { id: true },
  })
  if (!existe) throw new NotFoundException('Recorrência não encontrada')

  const data: Prisma.despesasUncheckedUpdateManyInput = {}

  if (dto.tipo_movimento !== undefined) data.tipo_movimento = { set: dto.tipo_movimento }
  if (dto.unidade !== undefined) data.unidade = { set: dto.unidade }
  if (dto.categoria !== undefined) data.categoria = { set: dto.categoria }
  if (dto.classificacao !== undefined) data.classificacao = { set: dto.classificacao }
  if (dto.local !== undefined) data.local = { set: dto.local }
  if (dto.forma_pagamento !== undefined) data.forma_pagamento = { set: dto.forma_pagamento }
  if (dto.status !== undefined) data.status = { set: dto.status }

  if (dto.quantidade_parcelas !== undefined) {
    const parcelas = Number(dto.quantidade_parcelas)
    if (!Number.isFinite(parcelas) || parcelas < 1) {
      throw new BadRequestException('quantidade_parcelas inválida')
    }
    data.quantidade_parcelas = { set: parcelas }
  }

  if (dto.valor_total !== undefined) {
    data.valor_total = { set: new Prisma.Decimal(dto.valor_total) }
  }

  // ✅ funcionario opcional (updateMany: set direto no campo)
  if (dto.funcionario_id !== undefined) {
    const funcionarioId =
      dto.funcionario_id === null || dto.funcionario_id === undefined
        ? null
        : Number(dto.funcionario_id)

    data.funcionario_id = { set: funcionarioId }
  }

  // ✅ datas
  if (dto.data_registro !== undefined) {
    if (dto.data_registro && isNaN(new Date(dto.data_registro).getTime())) {
      throw new BadRequestException('data_registro inválida')
    }
    data.data_registro = { set: dto.data_registro ? new Date(dto.data_registro) : null }
  }

  if (dto.data_vencimento !== undefined) {
    if (dto.data_vencimento && isNaN(new Date(dto.data_vencimento).getTime())) {
      throw new BadRequestException('data_vencimento inválida')
    }
    data.data_vencimento = { set: dto.data_vencimento ? new Date(dto.data_vencimento) : null }
  }

  if (dto.data_pagamento !== undefined) {
    if (dto.data_pagamento && isNaN(new Date(dto.data_pagamento).getTime())) {
      throw new BadRequestException('data_pagamento inválida')
    }
    data.data_pagamento = { set: dto.data_pagamento ? new Date(dto.data_pagamento) : null }
  }

  const res = await this.prisma.despesas.updateMany({
    where: { recorrencia_id: recorrenciaId },
    data,
  })

  return res.count
}



  async remove(id: number): Promise<despesas> {
    await this.findOne(id)
    return this.prisma.despesas.delete({ where: { id } })
  }

  async removeRecorrencia(recorrenciaId: string): Promise<number> {
    const res = await this.prisma.despesas.deleteMany({
      where: { recorrencia_id: recorrenciaId },
    })
    if (res.count === 0) throw new NotFoundException('Recorrência não encontrada')
    return res.count
  }
}
