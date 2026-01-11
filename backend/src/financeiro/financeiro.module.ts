import { Module } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { FinanceiroController } from './financeiro.controller';
import { ContasPagarController } from './controllers/contas-pagar.controller';
import { ContasReceberController } from './controllers/contas-receber.controller';
import { ChequesController } from './controllers/cheques.controller';

@Module({
  controllers: [
    FinanceiroController,
    ContasPagarController,
    ContasReceberController,
    ChequesController,
  ],
  providers: [FinanceiroService],
  exports: [FinanceiroService],
})
export class FinanceiroModule {}