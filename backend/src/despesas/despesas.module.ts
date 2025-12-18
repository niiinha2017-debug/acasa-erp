import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DespesasService } from './despesas.service'
import { DespesasController } from './despesas.controller'
import { Despesa } from './despesa.entity'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Despesa, LancamentoFinanceiro]),
  ],
  controllers: [DespesasController],
  providers: [DespesasService],
})
export class DespesasModule {}
