import { Module } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'
import { FinanceiroController } from './financeiro.controller'
import { FechamentoController } from './fechamento.controller'

@Module({
  controllers: [
    FinanceiroController,
    FechamentoController, // 👈 AQUI
  ],
  providers: [FinanceiroService],
})
export class FinanceiroModule {}
