import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Despesa } from './despesa.entity'
import { DespesasService } from './despesas.service'
import { DespesasController } from './despesas.controller'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Despesa,
      LancamentoFinanceiro // ✅ ESSENCIAL
    ]),
  ],
  controllers: [DespesasController],
  providers: [DespesasService],
})
export class DespesasModule {}
