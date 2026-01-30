import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // HELPERS
  // =========================================================
  private toNumber(value: any, field: string) {
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestException(`${field} inválido`)
    return n
  }

  private toDate(value: any, field: string) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`${field} inválida`)
    return d
  }

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

// =========================================================
// ✅ CONSOLIDADO (CONTAS A PAGAR) = DESPESAS + COMPRAS + FECHAMENTOS
// =========================================================
async listarContasPagarConsolidado(filtros: { fornecedor_id?: number; status?: string }) {
  const status = filtros.status || undefined
  const fornecedorId = filtros.fornecedor_id || undefined

  const [despesas, compras, fechamentos] = await Promise.all([
    // DESPESAS
    this.prisma.despesas.findMany({
      where: {
        status: status,
      },
      orderBy: { data_vencimento: 'asc' },
    }),

    // COMPRAS
    this.prisma.compras.findMany({
      where: {
        fornecedor_id: fornecedorId,
        status: status,
      },
      include: { fornecedor: true },
      orderBy: { vencimento_em: 'asc' },
    }),

    // CONTAS_PAGAR (FECHAMENTO MENSAL)
    this.prisma.contas_pagar.findMany({
      where: {
        fornecedor_id: fornecedorId,
        status: status,
      },
      include: {
        fornecedor: true,
        fornecedor_cobrador: true,
        cheques: true,
      },
      orderBy: { vencimento_em: 'asc' },
    }),
  ])

  // Padroniza tudo em uma lista única
  return [
    // =====================
    // DESPESAS (origem = DESPESA)
    // =====================
    ...despesas.map((d) => ({
      id: d.id,
      origem: 'DESPESA',

      // “centro” (não tem fornecedor)
      fornecedor_id: null,
      fornecedor_nome: null,

      // dados principais
      descricao: d.categoria,
      observacao: d.classificacao,

      // valores
      valor: d.valor_total,
      valor_compensado: 0,

      // datas/status
      vencimento_em: d.data_vencimento,
      pago_em: d.data_pagamento,
      status: d.status,

      // extras (para tela)
      mes_referencia: null,
      ano_referencia: null,
      cheques_total: 0,
    })),

    // =====================
    // COMPRAS (origem = COMPRA)
    // =====================
    ...compras.map((c) => ({
      id: c.id,
      origem: 'COMPRA',

      fornecedor_id: c.fornecedor_id,
      fornecedor_nome: c.fornecedor?.nome_fantasia || null,

      descricao: 'COMPRA',
      observacao: c.tipo_compra,

      valor: c.valor_total,
      valor_compensado: 0,

      vencimento_em: c.vencimento_em,
      pago_em: null,
      status: c.status,

      mes_referencia: null,
      ano_referencia: null,
      cheques_total: 0,
    })),

    // =====================
    // FECHAMENTOS (origem = FECHAMENTO)
    // =====================
    ...fechamentos.map((cp) => ({
      id: cp.id,
      origem: 'FECHAMENTO',

      fornecedor_id: cp.fornecedor_id,
      fornecedor_nome: cp.fornecedor?.nome_fantasia || null,

      descricao: cp.descricao || `Fechamento ${String(cp.mes_referencia).padStart(2, '0')}/${cp.ano_referencia}`,
      observacao: cp.observacao || null,

      // ✅ aqui está a compensação do plano de corte
      valor: cp.valor_original,
      valor_compensado: cp.valor_compensado,

      vencimento_em: cp.vencimento_em,
      pago_em: cp.pago_em,
      status: cp.status,

      mes_referencia: cp.mes_referencia,
      ano_referencia: cp.ano_referencia,

      cheques_total: Array.isArray(cp.cheques) ? cp.cheques.length : 0,

      // opcional (se quiser usar na tela depois)
      fornecedor_cobrador_nome: cp.fornecedor_cobrador?.nome_fantasia || null,
      forma_pagamento_chave: cp.forma_pagamento_chave || null,
    })),
  ]
}

  // =========================================================
  // ✅ ATUALIZA VENCIDOS (FINANCEIRO)
  // =========================================================
  async atualizarVencidos() {
    const hoje = new Date()

    await this.prisma.despesas.updateMany({
      where: {
        data_vencimento: { lt: hoje },
        status: 'EM_ABERTO',
      },
      data: { status: 'VENCIDO' },
    })

    await this.prisma.compras.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: 'EM_ABERTO',
      },
      data: { status: 'VENCIDO' },
    })

    await this.prisma.contas_pagar.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: 'EM_ABERTO',
        pago_em: null,
      },
      data: { status: 'VENCIDO' },
    })

    await this.prisma.contas_receber.updateMany({
      where: {
        vencimento_em: { lt: hoje },
        status: 'EM_ABERTO',
        recebido_em: null,
      },
      data: { status: 'VENCIDO' },
    })
  }

  // =========================================================
  // CONTAS A PAGAR (tabela contas_pagar)
  // =========================================================
  async buscarContaPagar(id: number) {
    return this.prisma.contas_pagar.findUnique({
      where: { id },
      include: { fornecedor: true, fornecedor_cobrador: true, cheques: true, despesa: true },
    })
  }

  async criarContaPagar(dto: any) {
    return this.prisma.contas_pagar.create({ data: dto })
  }

  async atualizarContaPagar(id: number, dto: any) {
    return this.prisma.contas_pagar.update({ where: { id }, data: dto })
  }

  async removerContaPagar(id: number) {
  return this.prisma.contas_pagar.delete({ where: { id } })
}


  async pagarContaPagar(id: number, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const conta = await tx.contas_pagar.findUnique({
        where: { id },
        select: {
          id: true,
          valor_original: true,
          valor_compensado: true,
          forma_pagamento_chave: true,
          vencimento_em: true,
          status: true,
        },
      })
      if (!conta) throw new NotFoundException('Conta a pagar não encontrada')

      const pagoEm = new Date()

      const contaAtualizada = await tx.contas_pagar.update({
        where: { id },
        data: { status: 'PAGO', pago_em: pagoEm },
      })

      // ✅ gera despesa vinculada (usa seu model real: data_pagamento existe)
      await tx.despesas.create({
        data: {
          tipo_movimento: 'SAIDA',
          unidade: dto?.unidade || 'FÁBRICA',
          categoria: dto?.categoria || 'PAGAMENTO_FORNECEDOR',
          classificacao: dto?.classificacao || 'OPERACIONAL',
          local: dto?.local || 'ESTOQUE',

          valor_total: conta.valor_original,
          forma_pagamento: conta.forma_pagamento_chave || 'DINHEIRO',
          quantidade_parcelas: 1,

          data_vencimento: conta.vencimento_em,
          data_pagamento: pagoEm,

          status: 'PAGO',

          recorrencia_id: `CP-${conta.id}`,
        },
      })

      return contaAtualizada
    })
  }

  // =========================================================
  // CONTAS A RECEBER
  // =========================================================
async listarContasReceber(filtros: {
  fornecedor_id?: number
  cliente_id?: number
  status?: string
  data_ini?: string
  data_fim?: string
}) {
  const where: any = {
    fornecedor_id: filtros.fornecedor_id || undefined,
    cliente_id: filtros.cliente_id || undefined,
    status: filtros.status || undefined,
  }

  if (filtros.data_ini || filtros.data_fim) {
    where.vencimento_em = {}
    if (filtros.data_ini) where.vencimento_em.gte = new Date(filtros.data_ini)
    if (filtros.data_fim) where.vencimento_em.lte = new Date(filtros.data_fim)
  }

  return this.prisma.contas_receber.findMany({
    where,
    orderBy: [{ vencimento_em: 'asc' }, { id: 'desc' }],
  })
}


  async buscarContaReceber(id: number) {
    return this.prisma.contas_receber.findUnique({
      where: { id },
      include: { fornecedor: true, cliente: true, compensacoes: true },
    })
  }

  async criarContaReceber(dto: any) {
    return this.prisma.contas_receber.create({ data: dto })
  }

  async removerContaReceber(id: number) {
  return this.prisma.contas_receber.delete({ where: { id } })
}


  async atualizarContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({ where: { id }, data: dto })
  }

  async receberContaReceber(id: number, dto: any) {
    // ✅ ALINHADO AO MODEL: recebido_em existe e é usado no atualizarVencidos
    return this.prisma.contas_receber.update({
      where: { id },
      data: {
        status: 'PAGO', // se seu padrão é "RECEBIDO", troca aqui e nos relatórios
        recebido_em: new Date(),
        ...dto,
      },
    })
  }

  // =========================================================
  // CHEQUES
  // =========================================================
async listarCheques(filtros: { status?: string; banco?: string; data_ini?: string; data_fim?: string }) {
  const where: any = {
    status: filtros.status || undefined,
    banco: filtros.banco ? { contains: filtros.banco } : undefined,
  }

  if (filtros.data_ini || filtros.data_fim) {
    where.data_vencimento = {}
    if (filtros.data_ini) where.data_vencimento.gte = new Date(filtros.data_ini)
    if (filtros.data_fim) where.data_vencimento.lte = new Date(filtros.data_fim)
  }

  return this.prisma.cheques.findMany({
    where,
    orderBy: { data_vencimento: 'asc' },
  })
}


  async buscarChequePorId(id: number) {
    return this.prisma.cheques.findUnique({
      where: { id },
      include: { conta_pagar: { include: { fornecedor: true } } },
    })
  }

  async atualizarStatusCheque(id: number, status: string) {
    const st = String(status || '').trim()
    if (!st) throw new BadRequestException('status é obrigatório')

    return this.prisma.cheques.update({
      where: { id },
      data: { status: st },
    })
  }

  // =========================================================
  // ✅ FECHAMENTO MENSAL POR FORNECEDOR
  // =========================================================
  async fecharMesFornecedor(body: {
    fornecedor_id: number
    mes: number
    ano: number
    forma_pagamento_chave: string
    vencimento_em?: string
    cheques?: { numero: string; banco: string; valor: number; data_vencimento: string }[]
  }) {
    const fornecedor_id = this.toNumber(body?.fornecedor_id, 'fornecedor_id')
    const mes = this.toNumber(body?.mes, 'mes')
    const ano = this.toNumber(body?.ano, 'ano')
    const forma = String(body?.forma_pagamento_chave || '').trim()
    if (!forma) throw new BadRequestException('forma_pagamento_chave é obrigatório')

    return this.prisma.$transaction(async (tx) => {
      // 1) período do mês
      const inicio = new Date(ano, mes - 1, 1, 0, 0, 0)
      const fim = new Date(ano, mes, 0, 23, 59, 59)

      // 2) compras EM_ABERTO do mês
      const compras = await tx.compras.findMany({
        where: {
          fornecedor_id,
          status: 'EM_ABERTO',
          data_compra: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      })
      const totalCompras = this.round2(compras.reduce((s, c) => s + Number(c.valor_total || 0), 0))

      // 3) plano de corte (crédito) do mês
      const planos = await tx.plano_corte.findMany({
        where: {
          fornecedor_id,
          status: 'EM_ABERTO',
          data_venda: { gte: inicio, lte: fim },
        },
        select: { id: true, valor_total: true },
      })
      const totalPlanos = this.round2(planos.reduce((s, p) => s + Number(p.valor_total || 0), 0))


// 4) saldo do mês (✅ compensação correta)
const compensado = this.round2(Math.min(totalCompras, totalPlanos))
const valorAPagar = this.round2(Math.max(totalCompras - totalPlanos, 0))
const valorCredito = this.round2(Math.max(totalPlanos - totalCompras, 0))
const saldo = this.round2(totalCompras - totalPlanos) // se você quiser continuar retornando


      // 5) vencimento padrão
      const vencPadrao = body?.vencimento_em
        ? this.toDate(body.vencimento_em, 'vencimento_em')
        : new Date(ano, mes, 5) // dia 5 do próximo mês

      // 6) cria contas_pagar
      const contaPagar = await tx.contas_pagar.create({
        data: {
          fornecedor_id,
          mes_referencia: mes,
          ano_referencia: ano,
          descricao: `Fechamento ${String(mes).padStart(2, '0')}/${ano}`,
          observacao: `Compras: ${totalCompras} | PlanoCorte: ${totalPlanos} | Compensado: ${compensado} | Saldo: ${saldo}`,
          valor_original: valorAPagar,
          valor_compensado: compensado,
          status: valorAPagar > 0 ? 'EM_ABERTO' : 'PAGO',
          forma_pagamento_chave: forma,
          vencimento_em: vencPadrao,
          pago_em: valorAPagar > 0 ? null : new Date(),
        },
        select: { id: true },
      })

      // 7) cria cheques (se vier)
      if (body?.cheques?.length) {
        for (const ch of body.cheques) {
          const numero = String(ch?.numero || '').trim()
          const banco = String(ch?.banco || '').trim()
          const valor = Number(ch?.valor || 0)
          if (!numero) throw new BadRequestException('Cheque: numero é obrigatório')
          if (!banco) throw new BadRequestException('Cheque: banco é obrigatório')
          if (!Number.isFinite(valor) || valor <= 0) throw new BadRequestException('Cheque: valor inválido')

          await tx.cheques.create({
            data: {
              numero,
              banco,
              valor,
              data_vencimento: this.toDate(ch.data_vencimento, 'Cheque.data_vencimento'),
              conta_pagar_id: contaPagar.id,
            },
          })
        }
      }

      // 8) baixa o mês
      if (compras.length) {
        await tx.compras.updateMany({
          where: { id: { in: compras.map((c) => c.id) } },
          data: { status: 'PAGO' },
        })
      }

      if (planos.length) {
        await tx.plano_corte.updateMany({
          where: { id: { in: planos.map((p) => p.id) } },
          data: { status: 'PAGO' },
        })
      }

      // 9) crédito para próximo mês
      let contaReceber: { id: number } | null = null

      if (valorCredito > 0) {
        contaReceber = await tx.contas_receber.create({
          data: {
            fornecedor_id,
            origem_tipo: 'CREDITO_FECHAMENTO',
            origem_id: contaPagar.id,
            descricao: `Crédito fechamento ${String(mes).padStart(2, '0')}/${ano}`,
            valor_original: valorCredito,
            valor_compensado: 0,
            status: 'EM_ABERTO',
            vencimento_em: null,
            recebido_em: null,
          },
          select: { id: true },
        })

        await tx.fornecedor_compensacoes.create({
          data: {
            fornecedor_id,
            conta_pagar_id: contaPagar.id,
            conta_receber_id: contaReceber.id,
            valor: valorCredito,
            observacao: `Crédito para abater no próximo mês (${String(mes).padStart(2, '0')}/${ano})`,
          },
        })
      }

      return {
        fornecedor_id,
        mes,
        ano,
        total_compras: totalCompras,
        total_planos: totalPlanos,
        saldo_final: saldo,
        valor_a_pagar: valorAPagar,
        credito_para_proximo: valorCredito,
        conta_pagar_id: contaPagar.id,
        conta_receber_id: contaReceber?.id || null,
      }
    })
  }

  // =========================================================
  // ✅ COMPENSAÇÃO (IDs obrigatórios)
  // =========================================================
  async compensarFornecedor(fornecedorId: number, dto: any) {
    const fornecedor_id = this.toNumber(fornecedorId, 'fornecedorId')
    const conta_pagar_id = this.toNumber(dto?.conta_pagar_id, 'conta_pagar_id')
    const conta_receber_id = this.toNumber(dto?.conta_receber_id, 'conta_receber_id')
    const valor = Number(dto?.valor || 0)
    if (!Number.isFinite(valor) || valor <= 0) throw new BadRequestException('valor inválido')

    return this.prisma.fornecedor_compensacoes.create({
      data: {
        fornecedor_id,
        conta_pagar_id,
        conta_receber_id,
        valor,
        observacao: dto?.observacao ? String(dto.observacao).trim() : null,
      },
    })
  }
  async listarContasPagarFechamentos(filtros: {
  fornecedor_id?: number
  status?: string
  data_ini?: string
  data_fim?: string
}) {
  const where: any = {
    fornecedor_id: filtros.fornecedor_id || undefined,
    status: filtros.status?.trim() || undefined,
  }

  // filtro por vencimento
  if (filtros.data_ini || filtros.data_fim) {
    where.vencimento_em = {}
    if (filtros.data_ini) where.vencimento_em.gte = new Date(filtros.data_ini)
    if (filtros.data_fim) where.vencimento_em.lte = new Date(filtros.data_fim)
  }

  return this.prisma.contas_pagar.findMany({
    where,
    include: {
      fornecedor: true,
      fornecedor_cobrador: true,
      cheques: true,
    },
    orderBy: [{ vencimento_em: 'asc' }, { id: 'desc' }],
  })
}

}
