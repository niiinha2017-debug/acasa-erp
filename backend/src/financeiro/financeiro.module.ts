import { Module } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { FinanceiroService } from './financeiro.service'

import { ContasPagarController } from './contas-pagar.controller'
import { ChequesController } from './cheques.controller'
import { FechamentoController } from './fechamento.controller'
// import { ContasReceberController } from './contas-receber.controller' // se existir

@Module({
  controllers: [
    ContasPagarController,
    ChequesController,
    FechamentoController,
    // ContasReceberController,
  ],
  providers: [FinanceiroService, PrismaService],
})
export class FinanceiroModule {}
