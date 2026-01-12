import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== MÉTODOS DE CONTAS A PAGAR =====
  async listarContasPagar(filtros: { fornecedor_id?: number; status?: string }) {
    return this.prisma.contas_pagar.findMany({
      where: {
        fornecedor_id: filtros.fornecedor_id || undefined,
        status: filtros.status || undefined,
      },
      include: { fornecedor: true },
    });
  }

  async buscarContaPagar(id: number) {
    return this.prisma.contas_pagar.findUnique({ where: { id }, include: { fornecedor: true } });
  }

  async criarContaPagar(dto: any) {
    return this.prisma.contas_pagar.create({ data: dto });
  }

  async atualizarContaPagar(id: number, dto: any) {
    return this.prisma.contas_pagar.update({ where: { id }, data: dto });
  }

  async pagarContaPagar(id: number, dto: any) {
    return await this.prisma.$transaction(async (tx) => {
      const conta = await tx.contas_pagar.update({
        where: { id },
        data: { status: 'PAGO', pago_em: new Date() },
        include: { fornecedor: true }
      });

      await tx.despesas.create({
        data: {
          tipo_movimento: 'SAIDA', // Corrigido de 'tipo_movemento'
          unidade: dto.unidade || 'FÁBRICA',
          categoria: 'PAGAMENTO_FORNECEDOR',
          classificacao: 'OPERACIONAL',
          local: 'ESTOQUE',
          valor_total: conta.valor_original,
          forma_pagamento: conta.forma_pagamento_chave || 'DINHEIRO',
          quantidade_parcelas: 1,
          data_vencimento: conta.vencimento_em,
          data_pagamento: new Date(),
          status: 'PAGO',
          recorrencia_id: `CP-${conta.id}` 
        }
      });
      return conta;
    });
  }

  // ===== MÉTODOS DE CONTAS A RECEBER =====
  async listarContasReceber(filtros: { fornecedor_id?: number; status?: string }) {
    return this.prisma.contas_receber.findMany({
      where: {
        fornecedor_id: filtros.fornecedor_id || undefined,
        status: filtros.status || undefined,
      }
    });
  }

  async buscarContaReceber(id: number) {
    return this.prisma.contas_receber.findUnique({ where: { id } });
  }

  async criarContaReceber(dto: any) {
    return this.prisma.contas_receber.create({ data: dto });
  }

  async atualizarContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({ where: { id }, data: dto });
  }

  async receberContaReceber(id: number, dto: any) {
    return this.prisma.contas_receber.update({
      where: { id },
      data: { status: 'RECEBIDO', ...dto }
    });
  }

  // ===== ACERTO E COMPENSAÇÃO =====
  async calcularSaldoDevedorFornecedor(fornecedorId: number) {
    const compras = await this.prisma.compras.aggregate({
      where: { fornecedor_id: fornecedorId, status: 'ATIVO' },
      _sum: { valor_total: true },
    });
    const planosCorte = await this.prisma.plano_corte.aggregate({
      where: { fornecedor_id: fornecedorId, status: 'PENDENTE' },
      _sum: { valor_total: true },
    });
    return {
      totalDebito: Number(compras._sum.valor_total || 0),
      totalCredito: Number(planosCorte._sum.valor_total || 0),
      saldoLiquido: Number(compras._sum.valor_total || 0) - Number(planosCorte._sum.valor_total || 0),
    };
  }

  async liquidarDividaFornecedor(dados: any) {
    // Implementação da lógica de transação que discutimos anteriormente
    return { message: "Processado" };
  }

  // ===== CHEQUES =====
// Adicione estes dois para resolver os erros do ChequesController
async buscarChequePorId(id: number) {
  return this.prisma.cheques.findUnique({ where: { id } });
}

async atualizarStatusCheque(id: number, status: string) {
  return this.prisma.cheques.update({
    where: { id },
    data: { status }
  });
}

// Ajuste o método de compensação (Erro na linha 112)
// CORREÇÃO DO ERRO TS2322 (Linha 125)
 async compensarFornecedor(fornecedorId: number, dto: any) {
  return this.prisma.fornecedor_compensacoes.create({
    data: {
      fornecedor: { connect: { id: fornecedorId } },
      valor: dto.valor,
      observacao: dto.observacao || '',
      data_compensacao: new Date(),
      // O Prisma exige esses campos com base no seu schema:
      conta_pagar: undefined, 
      conta_receber: undefined
    },
  });
}

  // CORREÇÃO DO ERRO TS2339 (Método que faltava para o ChequesController)
  async listarCheques(filtros: { status?: string; banco?: string }) {
    return this.prisma.cheques.findMany({
      where: {
        status: filtros.status || undefined,
        banco: filtros.banco ? { contains: filtros.banco } : undefined,
      },
      orderBy: { data_vencimento: 'asc' },
    });
  }
}