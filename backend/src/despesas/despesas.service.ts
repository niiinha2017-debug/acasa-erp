import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma, despesas } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDespesaDto } from './dto/create-despesa.dto'
import { UpdateDespesaDto } from './dto/update-despesa.dto'

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

private parseBRDate(input?: string): Date | null {
  if (!input) return null

  // aceita ISO também
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d
  }

  // dd/mm/aaaa
  const m = String(input).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null

  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])

  const d = new Date(yyyy, mm - 1, dd)
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null
  return d
}

private parseMoney(input: any): number {
  const s = String(input ?? '').trim()
  if (!s) return NaN

  const cleaned = s.replace(/[^\d,.-]/g, '')
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned

  return Number(normalized)
}

private toDecimalString(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2)
}


  async create(dto: CreateDespesaDto): Promise<despesas[]> {
    // parcelas
    let parcelas = Number(dto.quantidade_parcelas ?? 1)
    if (!Number.isFinite(parcelas) || parcelas < 1) parcelas = 1

    // datas
     const primeiroVenc = this.parseBRDate(dto.data_vencimento)
     if (!primeiroVenc) throw new BadRequestException('data_vencimento inválida')

     const dataRegistro = dto.data_registro ? this.parseBRDate(dto.data_registro) : null
     if (dto.data_registro && !dataRegistro) throw new BadRequestException('data_registro inválida')

     const dataPagamento = dto.data_pagamento ? this.parseBRDate(dto.data_pagamento) : null
     if (dto.data_pagamento && !dataPagamento) throw new BadRequestException('data_pagamento inválida')


    // valida banco/cartão
    const precisaBanco = ['PIX', 'TRANSFERENCIA', 'CHEQUE', 'BOLETO'].includes(dto.forma_pagamento)
    const precisaCartao = dto.forma_pagamento === 'CREDITO'

    if (precisaBanco) {
      if (!dto.conta_bancaria_key) throw new BadRequestException('Selecione o banco/conta')
      if (!dto.conta_bancaria_tipo_key) throw new BadRequestException('Selecione o tipo de conta')
    }

    if (precisaCartao) {
      if (!dto.cartao_credito_key) throw new BadRequestException('Selecione o cartão de crédito')
    }

    // regra de prazo
    const ehPrazo = parcelas > 1 || ['CREDITO', 'CHEQUE', 'BOLETO'].includes(dto.forma_pagamento)

    // funcionario opcional (blindado)
    const funcionarioIdNum = Number(dto.funcionario_id)
    const temFuncionario = Number.isFinite(funcionarioIdNum) && funcionarioIdNum > 0

    const totalNum = this.parseMoney(dto.valor_total)
if (!Number.isFinite(totalNum) || totalNum <= 0) throw new BadRequestException('valor_total inválido')


// base (uma despesa só)
const baseData: Prisma.despesasCreateInput = {
  tipo_movimento: dto.tipo_movimento,
  unidade: dto.unidade,
  categoria: dto.categoria,
  classificacao: dto.classificacao,
  local: dto.local ?? '',

  valor_total: new Prisma.Decimal(this.toDecimalString(totalNum)),

  forma_pagamento: dto.forma_pagamento,
  quantidade_parcelas: parcelas,

      conta_bancaria_key: dto.conta_bancaria_key ?? null,
      conta_bancaria_tipo_key: dto.conta_bancaria_tipo_key ?? null,
      cartao_credito_key: dto.cartao_credito_key ?? null,

      data_registro: dataRegistro ?? new Date(),
      data_vencimento: primeiroVenc,
      status: ehPrazo ? 'EM_ABERTO' : (dto.status || 'EM_ABERTO'),

      // ✅ não vamos mais usar recorrencia/parcela na despesa
      recorrencia_id: null,
      parcela_numero: null,

      ...(temFuncionario ? { funcionario: { connect: { id: funcionarioIdNum } } } : {}),
    }

    // calcula parcelas (centavos)

    const totalCents = Math.round(totalNum * 100)

    const baseCents = Math.floor(totalCents / parcelas)
    const resto = totalCents % parcelas
    const valoresParcelasCents = Array.from(
      { length: parcelas },
      (_, i) => baseCents + (i < resto ? 1 : 0),
    )

    return await this.prisma.$transaction(async (tx) => {
      // 1) cria UMA despesa
      const despesa = await tx.despesas.create({
        data: {
          ...baseData,
          // se for prazo, não marca pagamento na despesa
          data_pagamento: ehPrazo ? null : dataPagamento,
        },
      })

      // 2) cria títulos (parcelas) no financeiro
      if (ehPrazo) {
        const tipoTitulo =
          dto.forma_pagamento === 'CREDITO'
            ? 'CARTAO'
            : dto.forma_pagamento === 'CHEQUE'
              ? 'CHEQUE'
              : dto.forma_pagamento === 'BOLETO'
                ? 'BOLETO'
                : 'PARCELA'

        const meta: any = {}
        if (dto.forma_pagamento === 'CREDITO') meta.cartao_credito_key = dto.cartao_credito_key || null
        if (precisaBanco) {
          meta.conta_bancaria_key = dto.conta_bancaria_key || null
          meta.conta_bancaria_tipo_key = dto.conta_bancaria_tipo_key || null
        }

        await tx.titulos_financeiros.createMany({
          data: valoresParcelasCents.map((cents, i) => ({
            despesa_id: despesa.id,
            tipo: tipoTitulo,
            valor: new Prisma.Decimal((cents / 100).toFixed(2)),
            status: 'EM_ABERTO',
            vencimento_em: this.addMeses(primeiroVenc, i),
            pago_em: null,
            parcelas_total: parcelas,
            parcela_numero: parcelas > 1 ? i + 1 : 1,
            meta,
          })),
        })
      }

      return [despesa]
    })
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

    // parcelas finais (>=1)
    let parcelasFinal = dto.quantidade_parcelas ?? atual.quantidade_parcelas ?? 1
    parcelasFinal = Number(parcelasFinal)
    if (!Number.isFinite(parcelasFinal) || parcelasFinal < 1) {
      throw new BadRequestException('quantidade_parcelas inválida')
    }

    const ehPrazoFinal =
      parcelasFinal > 1 || ['CREDITO', 'CHEQUE', 'BOLETO'].includes(String(formaFinal || '').trim())

    const bancoFinal = dto.conta_bancaria_key ?? atual.conta_bancaria_key
    const tipoFinal = dto.conta_bancaria_tipo_key ?? atual.conta_bancaria_tipo_key
    const cartaoFinal = dto.cartao_credito_key ?? atual.cartao_credito_key

    // validações conforme forma final
    const precisaBancoFinal = ['PIX', 'TRANSFERENCIA', 'CHEQUE', 'BOLETO'].includes(String(formaFinal || '').trim())
    const precisaCartaoFinal = String(formaFinal || '').trim() === 'CREDITO'

    if (precisaBancoFinal) {
      if (!bancoFinal) throw new BadRequestException('Selecione o banco/conta')
      if (!tipoFinal) throw new BadRequestException('Selecione o tipo de conta')
    }

    if (precisaCartaoFinal) {
      if (!cartaoFinal) throw new BadRequestException('Selecione o cartão de crédito')
    }

    // vencimento base (primeiro vencimento)
const primeiroVenc = dto.data_vencimento
  ? this.parseBRDate(dto.data_vencimento)
  : new Date(atual.data_vencimento)

if (!primeiroVenc || isNaN(primeiroVenc.getTime())) {
  throw new BadRequestException('data_vencimento inválida')
}


    // total final
const totalFinalNum =
  dto.valor_total !== undefined
    ? this.parseMoney(dto.valor_total)
    : Number(String((atual as any).valor_total))

if (!Number.isFinite(totalFinalNum) || totalFinalNum <= 0) {
  throw new BadRequestException('valor_total inválido')
}


    // detecta se precisa recriar títulos
    const ehPrazoAtual =
      Number(atual.quantidade_parcelas || 1) > 1 ||
      ['CREDITO', 'CHEQUE', 'BOLETO'].includes(String(atual.forma_pagamento || '').trim())

    const mexeuNoPrazo =
      dto.valor_total !== undefined ||
      dto.quantidade_parcelas !== undefined ||
      dto.data_vencimento !== undefined ||
      dto.forma_pagamento !== undefined ||
      dto.conta_bancaria_key !== undefined ||
      dto.conta_bancaria_tipo_key !== undefined ||
      dto.cartao_credito_key !== undefined ||
      ehPrazoAtual !== ehPrazoFinal

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.despesasUpdateInput = {}

      // campos básicos
      if (dto.tipo_movimento !== undefined) data.tipo_movimento = dto.tipo_movimento
      if (dto.unidade !== undefined) data.unidade = dto.unidade
      if (dto.categoria !== undefined) data.categoria = dto.categoria
      if (dto.classificacao !== undefined) data.classificacao = dto.classificacao
      if (dto.local !== undefined) data.local = dto.local
      if (dto.forma_pagamento !== undefined) data.forma_pagamento = dto.forma_pagamento

      // despesa “mãe”
      data.quantidade_parcelas = parcelasFinal
      data.recorrencia_id = null
      data.parcela_numero = null

      // status: prazo trava em aberto; à vista respeita dto
      if (ehPrazoFinal) {
        data.status = 'EM_ABERTO'
      } else if (dto.status !== undefined) {
        data.status = dto.status
      }

      // valor
      if (dto.valor_total !== undefined) {
  data.valor_total = new Prisma.Decimal(this.toDecimalString(totalFinalNum))
}


      // datas
const dr = dto.data_registro ? this.parseBRDate(dto.data_registro) : null
if (dto.data_registro && !dr) throw new BadRequestException('data_registro inválida')
if (dr) data.data_registro = dr

      
const dv = dto.data_vencimento ? this.parseBRDate(dto.data_vencimento) : null
if (dto.data_vencimento && !dv) throw new BadRequestException('data_vencimento inválida')
if (dv) data.data_vencimento = dv


      // data_pagamento: prazo sempre null; à vista permite
      if (ehPrazoFinal) {
        data.data_pagamento = null
      } else if (dto.data_pagamento !== undefined) {
const dp = dto.data_pagamento ? this.parseBRDate(dto.data_pagamento) : null
if (dto.data_pagamento && !dp) throw new BadRequestException('data_pagamento inválida')
data.data_pagamento = dp
}

      // chaves banco/cartão (salva o que veio, mas normaliza conforme formaFinal)
      if (dto.conta_bancaria_key !== undefined) data.conta_bancaria_key = dto.conta_bancaria_key ?? null
      if (dto.conta_bancaria_tipo_key !== undefined) data.conta_bancaria_tipo_key = dto.conta_bancaria_tipo_key ?? null
      if (dto.cartao_credito_key !== undefined) data.cartao_credito_key = dto.cartao_credito_key ?? null

      if (precisaBancoFinal) {
        data.cartao_credito_key = null
      } else if (precisaCartaoFinal) {
        data.conta_bancaria_key = null
        data.conta_bancaria_tipo_key = null
      } else {
        data.conta_bancaria_key = null
        data.conta_bancaria_tipo_key = null
        data.cartao_credito_key = null
      }

      // funcionário
      if (dto.funcionario_id !== undefined) {
        const funcionarioIdNum = Number(dto.funcionario_id)
        const temFuncionario = Number.isFinite(funcionarioIdNum) && funcionarioIdNum > 0

        data.funcionario = temFuncionario ? { connect: { id: funcionarioIdNum } } : { disconnect: true }
      }

      // 1) atualiza despesa
      const despesaAtualizada = await tx.despesas.update({ where: { id }, data })

      // 2) sincroniza títulos (se mexeu em algo de prazo)
      if (mexeuNoPrazo) {
        const existePago = await tx.titulos_financeiros.findFirst({
          where: { despesa_id: id, status: 'PAGO' },
          select: { id: true },
        })

        if (existePago) {
          throw new BadRequestException(
            'Não é permitido alterar parcelamento/valor/vencimento: existe parcela paga.',
          )
        }

        await tx.titulos_financeiros.deleteMany({ where: { despesa_id: id } })

        if (ehPrazoFinal) {
          const totalCents = Math.round(totalFinalNum * 100)
          const baseCents = Math.floor(totalCents / parcelasFinal)
          const resto = totalCents % parcelasFinal
          const valoresParcelasCents = Array.from(
            { length: parcelasFinal },
            (_, i) => baseCents + (i < resto ? 1 : 0),
          )

          const tipoTitulo =
            formaFinal === 'CREDITO'
              ? 'CARTAO'
              : formaFinal === 'CHEQUE'
                ? 'CHEQUE'
                : formaFinal === 'BOLETO'
                  ? 'BOLETO'
                  : 'PARCELA'

          const meta: any = {}
          if (formaFinal === 'CREDITO') meta.cartao_credito_key = cartaoFinal || null
          if (precisaBancoFinal) {
            meta.conta_bancaria_key = bancoFinal || null
            meta.conta_bancaria_tipo_key = tipoFinal || null
          }

          await tx.titulos_financeiros.createMany({
            data: valoresParcelasCents.map((cents, i) => ({
              despesa_id: id,
              tipo: tipoTitulo,
              valor: new Prisma.Decimal((cents / 100).toFixed(2)),
              status: 'EM_ABERTO',
              vencimento_em: this.addMeses(primeiroVenc, i),
              pago_em: null,
              parcelas_total: parcelasFinal,
              parcela_numero: parcelasFinal > 1 ? i + 1 : 1,
              meta,
            })),
          })
        }
      }

      return despesaAtualizada
    })
  }

  async remove(id: number): Promise<despesas> {
    await this.findOne(id)

    return this.prisma.$transaction(async (tx) => {
      // 1) apaga títulos vinculados à despesa (pra não ficar histórico solto)
      await tx.titulos_financeiros.deleteMany({ where: { despesa_id: id } })

      // 2) apaga a despesa
      return tx.despesas.delete({ where: { id } })
    })
  }
}
