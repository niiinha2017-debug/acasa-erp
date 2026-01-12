import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // ✅ CONSOLIDADO (CONTAS A PAGAR) = DESPESAS + COMPRAS
  // =========================================================
async listarContasPagarConsolidado(filtros: { fornecedor_id?: number; status?: string }) {
  const [despesas, compras] = await Promise.all([
    this.prisma.despesas.findMany({
      where: {
        status: filtros.status || undefined,
      },
      orderBy: { data_vencimento: 'asc' },
    }),

    this.prisma.compras.findMany({
      where: {
        fornecedor_id: filtros.fornecedor_id || undefined,
        status: filtros.status || undefined,
      },
      include: { fornecedor: true },
      orderBy: { vencimento_em: 'asc' },
    }),
  ])

  return [
    ...despesas.map(d => ({
      id: d.id,
      origem: 'DESPESA',
      fornecedor_nome: null,
      categoria: d.categoria,
      classificacao: d.classificacao,
      local: d.local,
      valor: d.valor_total,
      vencimento_em: d.data_vencimento,
      status: d.status,
    })),
    ...compras.map(c => ({
      id: c.id,
      origem: 'COMPRA',
      fornecedor_nome: c.fornecedor?.nome_fantasia || null,
      categoria: 'COMPRA',
      classificacao: c.tipo_compra,
      local: c.fornecedor?.nome_fantasia || '',
      valor: c.valor_total,
      vencimento_em: c.vencimento_em,
      status: c.status,
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
  // CONTAS A PAGAR (tabela contas_pagar) — mantém se ainda usa
  // =========================================================
  async buscarContaPagar(id: number) {
    return this.prisma.contas_pagar.findUnique({
      where: { id },
      include: { fornecedor: true },
    })
  }

  async criarContaPagar(dto: any) {
    return this.prisma.contas_pagar.create({ data: dto })
  }

  async atualizarContaPagar(id: number, dto: any) {
    return this.prisma.contas_pagar.update({ where: { id }, data: dto })
  }

  async pagarContaPagar(id: number, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const conta = await tx.contas_pagar.update({
        where: { id },
        data: { status: 'PAGO', pago_em: new Date() },
        include: { fornecedor: true },
      })

      // se você quer gerar uma despesa ao pagar conta_pagar:
await tx.despesas.create({
  data: {
    tipo_movimento: 'SAIDA',
    unidade: dto.unidade || 'FÁBRICA',
    categoria: 'PAGAMENTO_FORNECEDOR',
    classificacao: 'OPERACIONAL',
    local: 'ESTOQUE',
    valor_total: conta.valor_original,
    forma_pagamento: conta.forma_pagamento_chave || 'DINHEIRO',
    quantidade_parcelas: 1,
    data_vencimento: conta.vencimento_em,
    data_pagamento: new Date(),
    status: 'PAGO', // ✅ status financeiro
    recorrencia_id: `CP-${conta.id}`,
  },
})


      return conta
    })
  }

  // =========================================================
  // CONTAS A RECEBER
  // =========================================================
  async listarContasReceber(filtros: { fornecedor_id?: number; status?: string }) {
    return this.prisma.contas_receber.findMany({
      where: {
        fornecedor_id: filtros.fornecedor_id || undefined,
        status: filtros.status || undefined,
      },
    })
  }

  async buscarContaReceber(id: number) {
    return this.prisma.contas_receber.findUnique({ where: { id } })
  }

  async criarContaReceber(dto: any) {
    return this.prisma.contas_receber.create({ data: dto })
  }

  async atualizarContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({ where: { id }, data: dto })
  }

  async receberContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({
      where: { id },
      data: { status: 'RECEBIDO', ...dto },
    })
  }

  // =========================================================
  // SALDO FORNECEDOR (seu cálculo)
  // =========================================================
  async calcularSaldoDevedorFornecedor(fornecedorId: number) {
    const compras = await this.prisma.compras.aggregate({
      where: { fornecedor_id: fornecedorId, status: 'ATIVO' },
      _sum: { valor_total: true },
    })

    const planosCorte = await this.prisma.plano_corte.aggregate({
      where: { fornecedor_id: fornecedorId, status: 'PENDENTE' },
      _sum: { valor_total: true },
    })

    return {
      totalDebito: Number(compras._sum.valor_total || 0),
      totalCredito: Number(planosCorte._sum.valor_total || 0),
      saldoLiquido:
        Number(compras._sum.valor_total || 0) - Number(planosCorte._sum.valor_total || 0),
    }
  }

  async liquidarDividaFornecedor(_dados: any) {
    return { message: 'Processado' }
  }

  // =========================================================
  // CHEQUES
  // =========================================================
  async listarCheques(filtros: { status?: string; banco?: string }) {
    return this.prisma.cheques.findMany({
      where: {
        status: filtros.status || undefined,
        banco: filtros.banco ? { contains: filtros.banco } : undefined,
      },
      orderBy: { data_vencimento: 'asc' },
    })
  }

  async buscarChequePorId(id: number) {
    return this.prisma.cheques.findUnique({ where: { id } })
  }

  async atualizarStatusCheque(id: number, status: string) {
    return this.prisma.cheques.update({
      where: { id },
      data: { status },
    })
  }

async fecharMesFornecedor(body: {
  fornecedor_id: number
  mes: number
  ano: number
  forma_pagamento_chave: string
  vencimento_em?: string // opcional: se não vier, usa dia 5 do próximo mês
  cheques?: {
    numero: string
    banco: string
    valor: number
    data_vencimento: string
  }[]
}) {
  const { fornecedor_id, mes, ano, forma_pagamento_chave, vencimento_em, cheques } = body

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
    const totalCompras = compras.reduce((s, c) => s + Number(c.valor_total), 0)

    // 3) plano de corte (crédito) do mês
    const planos = await tx.plano_corte.findMany({
      where: {
        fornecedor_id,
        status: 'EM_ABERTO', // 👈 use seu status financeiro aqui (constante)
        data_venda: { gte: inicio, lte: fim },
      },
      select: { id: true, valor_total: true },
    })
    const totalPlanos = planos.reduce((s, p) => s + Number(p.valor_total), 0)

    // 4) saldo do mês (quanto eu devo pagar no fechamento)
    const saldo = totalCompras - totalPlanos
    const valorAPagar = saldo > 0 ? saldo : 0
    const valorCredito = saldo < 0 ? Math.abs(saldo) : 0

    // 5) cria o contas_pagar do fechamento (net a pagar)
    const vencPadrao = vencimento_em
      ? new Date(vencimento_em)
      : new Date(ano, mes, 5) // dia 5 do próximo mês

    const contaPagar = await tx.contas_pagar.create({
      data: {
        fornecedor_id,
        mes_referencia: mes,
        ano_referencia: ano,
        descricao: `Fechamento ${String(mes).padStart(2, '0')}/${ano}`,
        observacao: `Compras: ${totalCompras} | PlanoCorte: ${totalPlanos} | Saldo: ${saldo}`,
        valor_original: valorAPagar,     // 👈 o que vai ser pago
        valor_compensado: totalPlanos,   // 👈 crédito usado no mês
        status: valorAPagar > 0 ? 'EM_ABERTO' : 'PAGO', // se não tem nada a pagar, já fecha como PAGO
        forma_pagamento_chave,
        vencimento_em: vencPadrao,
      },
    })

    // 6) se tem cheques, cria e vincula no contas_pagar
    if (cheques?.length) {
      for (const ch of cheques) {
        await tx.cheques.create({
          data: {
            numero: ch.numero,
            banco: ch.banco,
            valor: ch.valor,
            data_vencimento: new Date(ch.data_vencimento),
            conta_pagar_id: contaPagar.id,
          },
        })
      }
    }

    // 7) baixa o mês: marca compras e plano_corte como PAGO (status financeiro)
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

    // 8) se sobrou CRÉDITO, cria contas_receber + compensação (SEM gambiarra)
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

    // 9) retorno para o frontend
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
  // ✅ COMPENSAÇÃO (obrigatório conectar IDs)
  // =========================================================
  async compensarFornecedor(fornecedorId: number, dto: any) {
    return this.prisma.fornecedor_compensacoes.create({
      data: {
        fornecedor: { connect: { id: fornecedorId } },
        conta_pagar: { connect: { id: dto.conta_pagar_id } },
        conta_receber: { connect: { id: dto.conta_receber_id } },
        valor: dto.valor,
        observacao: dto.observacao || '',
      },
    })
  }
}
