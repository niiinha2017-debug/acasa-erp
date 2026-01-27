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
  if (isNaN(primeiroVenc.getTime())) throw new BadRequestException('data_vencimento inválida')

  const dataRegistro = dto.data_registro ? new Date(dto.data_registro) : undefined
  if (dto.data_registro && isNaN(dataRegistro!.getTime())) throw new BadRequestException('data_registro inválida')

  const dataPagamento = dto.data_pagamento ? new Date(dto.data_pagamento) : null
  if (dto.data_pagamento && isNaN(dataPagamento!.getTime())) throw new BadRequestException('data_pagamento inválida')

 // ✅ valida banco/cartão conforme forma_pagamento (ANTES do baseData)
// ✅ valida banco/cartão conforme forma_pagamento (ANTES do baseData)
const precisaBanco = ['PIX', 'TRANSFERENCIA', 'CHEQUE', 'BOLETO'].includes(dto.forma_pagamento)
const precisaCartao = dto.forma_pagamento === 'CREDITO'

if (precisaBanco) {
  if (!dto.conta_bancaria_key) throw new BadRequestException('Selecione o banco/conta')
  if (!dto.conta_bancaria_tipo_key) throw new BadRequestException('Selecione o tipo de conta')
}

if (precisaCartao) {
  if (!dto.cartao_credito_key) throw new BadRequestException('Selecione o cartão de crédito')
}



  // recorrência
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

    conta_bancaria_key: dto.conta_bancaria_key ?? null,
    conta_bancaria_tipo_key: dto.conta_bancaria_tipo_key ?? null,
    cartao_credito_key: dto.cartao_credito_key ?? null,

    data_registro: dataRegistro ?? new Date(),
    data_vencimento: primeiroVenc,
    status: dto.status,
    recorrencia_id: recorrenciaId,

    ...(funcionarioId ? { funcionario: { connect: { id: funcionarioId } } } : {}),
  }

  // ✅ dividir valor_total em parcelas (centavos)
  const total = Number(dto.valor_total)
  if (!Number.isFinite(total) || total <= 0) throw new BadRequestException('valor_total inválido')

  const totalCents = Math.round(total * 100)
  const base = Math.floor(totalCents / parcelas)
  const resto = totalCents % parcelas

  const valoresParcelasCents = Array.from({ length: parcelas }, (_, i) => base + (i < resto ? 1 : 0))

  // cria parcelas
  const criadas = await this.prisma.$transaction(
    Array.from({ length: parcelas }).map((_, i) =>
      this.prisma.despesas.create({
        data: {
          ...baseData,
          valor_total: new Prisma.Decimal((valoresParcelasCents[i] / 100).toFixed(2)),
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
  const atual = await this.findOne(id)
const formaFinal = dto.forma_pagamento ?? atual.forma_pagamento

const bancoFinal = dto.conta_bancaria_key ?? atual.conta_bancaria_key
const tipoFinal  = dto.conta_bancaria_tipo_key ?? atual.conta_bancaria_tipo_key
const cartaoFinal = dto.cartao_credito_key ?? atual.cartao_credito_key


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

  // ✅ PIX / Cartão (chaves de constantes)
  if (dto.conta_bancaria_key !== undefined) data.conta_bancaria_key = dto.conta_bancaria_key ?? null
  if (dto.conta_bancaria_tipo_key !== undefined) data.conta_bancaria_tipo_key = dto.conta_bancaria_tipo_key ?? null
  if (dto.cartao_credito_key !== undefined) data.cartao_credito_key = dto.cartao_credito_key ?? null

  // ✅ valida conforme forma_pagamento (use o valor final: dto.forma_pagamento ou existente)
const precisaBancoFinal = ['PIX', 'TRANSFERENCIA', 'CHEQUE', 'BOLETO'].includes(formaFinal)
const precisaCartaoFinal = formaFinal === 'CREDITO'

if (precisaBancoFinal) {
  if (!bancoFinal) throw new BadRequestException('Selecione o banco/conta')
  if (!tipoFinal) throw new BadRequestException('Selecione o tipo de conta')
  data.cartao_credito_key = null
} else if (precisaCartaoFinal) {
  if (!cartaoFinal) throw new BadRequestException('Selecione o cartão de crédito')
  data.conta_bancaria_key = null
  data.conta_bancaria_tipo_key = null
} else {
  data.conta_bancaria_key = null
  data.conta_bancaria_tipo_key = null
  data.cartao_credito_key = null
}





  // ✅ funcionário opcional
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

    // ✅ PIX / Cartão (chaves de constantes)
  if (dto.conta_bancaria_key !== undefined) {
    data.conta_bancaria_key = { set: dto.conta_bancaria_key ?? null }
  }

  if (dto.conta_bancaria_tipo_key !== undefined) {
    data.conta_bancaria_tipo_key = { set: dto.conta_bancaria_tipo_key ?? null }
  }

  if (dto.cartao_credito_key !== undefined) {
    data.cartao_credito_key = { set: dto.cartao_credito_key ?? null }
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

if (dto.forma_pagamento) {
  const precisaBanco = ['PIX', 'TRANSFERENCIA', 'CHEQUE', 'BOLETO'].includes(dto.forma_pagamento)
  const precisaCartao = dto.forma_pagamento === 'CREDITO'

  if (precisaBanco) {
    if (!dto.conta_bancaria_key) throw new BadRequestException('Selecione o banco/conta')
    if (!dto.conta_bancaria_tipo_key) throw new BadRequestException('Selecione o tipo de conta')
    data.cartao_credito_key = { set: null }
  } else if (precisaCartao) {
    if (!dto.cartao_credito_key) throw new BadRequestException('Selecione o cartão de crédito')
    data.conta_bancaria_key = { set: null }
    data.conta_bancaria_tipo_key = { set: null }
  } else {
    data.conta_bancaria_key = { set: null }
    data.conta_bancaria_tipo_key = { set: null }
    data.cartao_credito_key = { set: null }
  }
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
