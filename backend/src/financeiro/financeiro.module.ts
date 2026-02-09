import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroService } from './financeiro.service';

import { ContasPagarController } from './contas-pagar.controller';
import { ContasReceberController } from './contas-receber.controller';
import { FechamentoController } from './fechamento.controller';
// import { ContasReceberController } from './contas-receber.controller' // se existir

@Module({
  controllers: [
    ContasPagarController,
    ContasReceberController,
    FechamentoController,
  ],
  providers: [FinanceiroService],
})
export class FinanceiroModule {}
