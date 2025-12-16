import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FinanceiroService } from './financeiro.service'
import { FinanceiroController } from './financeiro.controller'
import { LancamentoFinanceiro } from './lancamento-financeiro.entity'

@Module({
  imports: [TypeOrmModule.forFeature([LancamentoFinanceiro])],
  controllers: [FinanceiroController],
  providers: [FinanceiroService],
})
export class FinanceiroModule {}
