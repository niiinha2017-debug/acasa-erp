import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVendaDto } from './dto/create-venda.dto'
import { UpdateVendaDto } from './dto/update-venda.dto'

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

@Injectable()
export class VendasService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularVenda(input: {
    itens: Array<{ quantidade: number; valor_unitario: number }>
    taxa_pagamento_percentual_aplicado?: number | null
    taxa_nota_fiscal_percentual_aplicado?: number | null
    comissoes?: Array<{ percentual_aplicado: number }>
  }) {
    const valor_bruto = round2(
      (input.itens || []).reduce((acc, it) => acc + Number(it.quantidade) * Number(it.valor_unitario), 0),
    )

    const taxaPag = Number(input.taxa_pagamento_percentual_aplicado ?? 0)
    const taxaNf = Number(input.taxa_nota_fiscal_percentual_aplicado ?? 0)

    const valor_taxa_pagamento = round2(valor_bruto * (taxaPag / 100))
    const valor_nota_fiscal = round2(valor_bruto * (taxaNf / 100))

    const soma_comissoes = round2(
      (input.comissoes || []).reduce((acc, c) => acc + (valor_bruto * (Number(c.percentual_aplicado) / 100)), 0),
    )

    const valor_total = round2(valor_bruto + valor_taxa_pagamento + valor_nota_fiscal + soma_comissoes)

    return {
      valor_bruto,
      valor_taxa_pagamento,
      valor_nota_fiscal,
      valor_total,
      soma_comissoes,
    }
  }

  async listar() {
    return this.prisma.vendas.findMany({
      orderBy: { id: 'desc' },
      include: { itens: true, comissoes: true },
    })
  }

  async buscarPorId(id: number) {
    const venda = await this.prisma.vendas.findUnique({
      where: { id },
      include: { itens: true, comissoes: true },
    })
    if (!venda) throw new NotFoundException('Venda não encontrada')
    return venda
  }

  async criar(dto: CreateVendaDto) {
    if (!dto.itens?.length) throw new BadRequestException('Venda precisa ter ao menos 1 item')

    const calc = this.calcularVenda({
      itens: dto.itens,
      taxa_pagamento_percentual_aplicado: dto.taxa_pagamento_percentual_aplicado ?? null,
      taxa_nota_fiscal_percentual_aplicado: dto.taxa_nota_fiscal_percentual_aplicado ?? null,
      comissoes: dto.comissoes || [],
    })

    return this.prisma.$transaction(async (tx) => {
      const venda = await tx.vendas.create({
        data: {
          cliente_id: dto.cliente_id,
          orcamento_id: dto.orcamento_id ?? null,
          status: dto.status,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          observacao: dto.observacao ?? null,
          forma_pagamento_chave: dto.forma_pagamento_chave ?? null,

          taxa_pagamento_percentual_aplicado: dto.taxa_pagamento_percentual_aplicado ?? null,
          valor_taxa_pagamento: calc.valor_taxa_pagamento,

          taxa_nota_fiscal_percentual_aplicado: dto.taxa_nota_fiscal_percentual_aplicado ?? null,
          valor_nota_fiscal: calc.valor_nota_fiscal,

          valor_bruto: calc.valor_bruto,
          valor_total: calc.valor_total,
        },
      })

      // itens (congelados)
      await tx.vendas_itens.createMany({
        data: dto.itens.map((it) => ({
          venda_id: venda.id,
          nome_ambiente: it.nome_ambiente,
          descricao: it.descricao,
          quantidade: it.quantidade,
          valor_unitario: it.valor_unitario,
          valor_total: round2(Number(it.quantidade) * Number(it.valor_unitario)),
        })),
      })

      // comissões (snapshot + valor calculado)
      if (dto.comissoes?.length) {
        await tx.vendas_comissoes.createMany({
          data: dto.comissoes.map((c) => ({
            venda_id: venda.id,
            tipo_comissao_chave: c.tipo_comissao_chave,
            percentual_aplicado: c.percentual_aplicado,
            valor_comissao: round2(calc.valor_bruto * (Number(c.percentual_aplicado) / 100)),
            responsavel_nome: c.responsavel_nome ?? null,
          })),
        })
      }

      return tx.vendas.findUnique({
        where: { id: venda.id },
        include: { itens: true, comissoes: true },
      })
    })
  }

  async atualizar(id: number, dto: UpdateVendaDto) {
    const atual = await this.prisma.vendas.findUnique({
      where: { id },
      include: { itens: true, comissoes: true },
    })
    if (!atual) throw new NotFoundException('Venda não encontrada')

    const itens = dto.itens ?? atual.itens.map((i) => ({
      quantidade: Number(i.quantidade),
      valor_unitario: Number(i.valor_unitario),
    }))

    const comissoes = dto.comissoes ?? atual.comissoes.map((c) => ({
      percentual_aplicado: Number(c.percentual_aplicado),
    }))

    const calc = this.calcularVenda({
      itens,
      taxa_pagamento_percentual_aplicado:
        (dto.taxa_pagamento_percentual_aplicado ?? atual.taxa_pagamento_percentual_aplicado) as any,
      taxa_nota_fiscal_percentual_aplicado:
        (dto.taxa_nota_fiscal_percentual_aplicado ?? atual.taxa_nota_fiscal_percentual_aplicado) as any,
      comissoes,
    })

    return this.prisma.$transaction(async (tx) => {
      await tx.vendas.update({
        where: { id },
        data: {
          cliente_id: dto.cliente_id ?? undefined,
          orcamento_id: dto.orcamento_id ?? undefined,
          status: dto.status ?? undefined,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          observacao: dto.observacao ?? undefined,
          forma_pagamento_chave: dto.forma_pagamento_chave ?? undefined,

          taxa_pagamento_percentual_aplicado: dto.taxa_pagamento_percentual_aplicado ?? undefined,
          valor_taxa_pagamento: calc.valor_taxa_pagamento,

          taxa_nota_fiscal_percentual_aplicado: dto.taxa_nota_fiscal_percentual_aplicado ?? undefined,
          valor_nota_fiscal: calc.valor_nota_fiscal,

          valor_bruto: calc.valor_bruto,
          valor_total: calc.valor_total,
        },
      })

      // se vier itens no dto: substitui tudo
      if (dto.itens) {
        await tx.vendas_itens.deleteMany({ where: { venda_id: id } })
        await tx.vendas_itens.createMany({
          data: dto.itens.map((it) => ({
            venda_id: id,
            nome_ambiente: it.nome_ambiente,
            descricao: it.descricao,
            quantidade: it.quantidade,
            valor_unitario: it.valor_unitario,
            valor_total: round2(Number(it.quantidade) * Number(it.valor_unitario)),
          })),
        })
      }

      // se vier comissões no dto: substitui tudo
      if (dto.comissoes) {
        await tx.vendas_comissoes.deleteMany({ where: { venda_id: id } })
        if (dto.comissoes.length) {
          await tx.vendas_comissoes.createMany({
            data: dto.comissoes.map((c) => ({
              venda_id: id,
              tipo_comissao_chave: c.tipo_comissao_chave,
              percentual_aplicado: c.percentual_aplicado,
              valor_comissao: round2(calc.valor_bruto * (Number(c.percentual_aplicado) / 100)),
              responsavel_nome: c.responsavel_nome ?? null,
            })),
          })
        }
      }

      return tx.vendas.findUnique({
        where: { id },
        include: { itens: true, comissoes: true },
      })
    })
  }

  async atualizarStatus(id: number, status: string) {
    await this.buscarPorId(id)
    return this.prisma.vendas.update({ where: { id }, data: { status } })
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    // itens e comissões já têm onDelete: Cascade
    return this.prisma.vendas.delete({ where: { id } })
  }
}
