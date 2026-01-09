import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarContaPagarDto } from './dto/criar-conta-pagar.dto'
import { AtualizarContaPagarDto } from './dto/atualizar-conta-pagar.dto'
import { PagarContaPagarDto } from './dto/pagar-conta-pagar.dto'
import { CriarContaReceberDto } from './dto/criar-conta-receber.dto'
import { AtualizarContaReceberDto } from './dto/atualizar-conta-receber.dto'
import { ReceberContaReceberDto } from './dto/receber-conta-receber.dto'
import { CompensarFornecedorDto } from './dto/compensar-fornecedor.dto'

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  private toDate(iso?: string, field?: string) {
    if (!iso) return undefined
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`Data inválida: ${field || 'data'}`)
    return d
  }

  // ===== PAGAR =====
  listarContasPagar(f: { fornecedor_id?: number; status?: string }) {
    return this.prisma.contas_pagar.findMany({
      where: {
        fornecedor_id: f.fornecedor_id,
        status: f.status,
      },
      orderBy: [{ vencimento_em: 'asc' }, { id: 'asc' }],
    })
  }

  async buscarContaPagar(id: number) {
    const row = await this.prisma.contas_pagar.findUnique({ where: { id } })
    if (!row) throw new NotFoundException('Conta a pagar não encontrada')
    return row
  }

  criarContaPagar(dto: CriarContaPagarDto) {
    return this.prisma.contas_pagar.create({
      data: {
        fornecedor_id: dto.fornecedor_id,
        fornecedor_cobrador_id: dto.fornecedor_cobrador_id ?? null,
        origem_tipo: dto.origem_tipo ?? null,
        origem_id: dto.origem_id ?? null,
        descricao: dto.descricao ?? null,
        observacao: dto.observacao ?? null,
        valor_original: dto.valor_original as any,
        status: dto.status,
        forma_pagamento_chave: dto.forma_pagamento_chave ?? null,
        parcelas_total: dto.parcelas_total ?? null,
        parcela_numero: dto.parcela_numero ?? null,
        vencimento_em: this.toDate(dto.vencimento_em, 'vencimento_em'),
      },
    })
  }

  atualizarContaPagar(id: number, dto: AtualizarContaPagarDto) {
    return this.prisma.contas_pagar.update({
      where: { id },
      data: {
        fornecedor_id: dto.fornecedor_id,
        fornecedor_cobrador_id: dto.fornecedor_cobrador_id ?? undefined,
        origem_tipo: dto.origem_tipo ?? undefined,
        origem_id: dto.origem_id ?? undefined,
        descricao: dto.descricao ?? undefined,
        observacao: dto.observacao ?? undefined,
        valor_original: (dto.valor_original as any) ?? undefined,
        status: dto.status ?? undefined,
        forma_pagamento_chave: dto.forma_pagamento_chave ?? undefined,
        parcelas_total: dto.parcelas_total ?? undefined,
        parcela_numero: dto.parcela_numero ?? undefined,
        vencimento_em: dto.vencimento_em ? this.toDate(dto.vencimento_em, 'vencimento_em') : undefined,
        pago_em: dto.pago_em ? this.toDate(dto.pago_em, 'pago_em') : undefined,
      },
    })
  }

  pagarContaPagar(id: number, dto: PagarContaPagarDto) {
    return this.prisma.contas_pagar.update({
      where: { id },
      data: {
        pago_em: this.toDate(dto.pago_em, 'pago_em') ?? new Date(),
        status: dto.status ?? undefined,
      },
    })
  }

  // ===== RECEBER =====
  listarContasReceber(f: { fornecedor_id?: number; status?: string }) {
    return this.prisma.contas_receber.findMany({
      where: {
        fornecedor_id: f.fornecedor_id,
        status: f.status,
      },
      orderBy: [{ vencimento_em: 'asc' }, { id: 'asc' }],
    })
  }

  async buscarContaReceber(id: number) {
    const row = await this.prisma.contas_receber.findUnique({ where: { id } })
    if (!row) throw new NotFoundException('Conta a receber não encontrada')
    return row
  }

  criarContaReceber(dto: CriarContaReceberDto) {
    return this.prisma.contas_receber.create({
      data: {
        fornecedor_id: dto.fornecedor_id,
        origem_tipo: dto.origem_tipo ?? null,
        origem_id: dto.origem_id ?? null,
        descricao: dto.descricao ?? null,
        observacao: dto.observacao ?? null,
        valor_original: dto.valor_original as any,
        status: dto.status,
        forma_recebimento_chave: dto.forma_recebimento_chave ?? null,
        vencimento_em: dto.vencimento_em ? this.toDate(dto.vencimento_em, 'vencimento_em') : null,
      },
    })
  }

  atualizarContaReceber(id: number, dto: AtualizarContaReceberDto) {
    return this.prisma.contas_receber.update({
      where: { id },
      data: {
        fornecedor_id: dto.fornecedor_id,
        origem_tipo: dto.origem_tipo ?? undefined,
        origem_id: dto.origem_id ?? undefined,
        descricao: dto.descricao ?? undefined,
        observacao: dto.observacao ?? undefined,
        valor_original: (dto.valor_original as any) ?? undefined,
        status: dto.status ?? undefined,
        forma_recebimento_chave: dto.forma_recebimento_chave ?? undefined,
        vencimento_em: dto.vencimento_em ? this.toDate(dto.vencimento_em, 'vencimento_em') : undefined,
        recebido_em: dto.recebido_em ? this.toDate(dto.recebido_em, 'recebido_em') : undefined,
      },
    })
  }

  receberContaReceber(id: number, dto: ReceberContaReceberDto) {
    return this.prisma.contas_receber.update({
      where: { id },
      data: {
        recebido_em: this.toDate(dto.recebido_em, 'recebido_em') ?? new Date(),
        status: dto.status ?? undefined,
      },
    })
  }

  // ===== COMPENSAR =====
  async compensarFornecedor(fornecedorId: number, dto: CompensarFornecedorDto) {
    if (!dto?.itens?.length) throw new BadRequestException('Informe ao menos 1 item de compensação.')

    return this.prisma.$transaction(async (tx) => {
      // valida que tudo pertence ao fornecedor e aplica abatimentos
      for (const it of dto.itens) {
        if (!it.valor || it.valor <= 0) throw new BadRequestException('Valor de compensação inválido.')

        const pagar = await tx.contas_pagar.findUnique({ where: { id: it.conta_pagar_id } })
        if (!pagar) throw new NotFoundException(`Conta pagar #${it.conta_pagar_id} não encontrada`)
        if (pagar.fornecedor_id !== fornecedorId) throw new BadRequestException('Conta a pagar não pertence ao fornecedor.')

        const receber = await tx.contas_receber.findUnique({ where: { id: it.conta_receber_id } })
        if (!receber) throw new NotFoundException(`Conta receber #${it.conta_receber_id} não encontrada`)
        if (receber.fornecedor_id !== fornecedorId) throw new BadRequestException('Conta a receber não pertence ao fornecedor.')

        await tx.fornecedor_compensacoes.create({
          data: {
            fornecedor_id: fornecedorId,
            conta_pagar_id: it.conta_pagar_id,
            conta_receber_id: it.conta_receber_id,
            valor: it.valor as any,
            observacao: it.observacao ?? null,
          },
        })

        await tx.contas_pagar.update({
          where: { id: it.conta_pagar_id },
          data: {
            valor_compensado: { increment: it.valor as any },
            status: dto.status_conta_pagar ?? undefined, // opcional (constante decide)
          },
        })

        await tx.contas_receber.update({
          where: { id: it.conta_receber_id },
          data: {
            valor_compensado: { increment: it.valor as any },
            status: dto.status_conta_receber ?? undefined, // opcional (constante decide)
          },
        })
      }

      return { ok: true }
    })
  }
}
