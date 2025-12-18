import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PlanoCorte } from './plano-corte.entity'
import { ItemPlanoCorte } from './item-plano-corte.entity'
import { PlanoCorteService } from './plano-corte.service'
import { PlanoCorteController } from './plano-corte.controller'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'
import { Produto } from '../produtos/produto.entity'


@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanoCorte,
      ItemPlanoCorte,
      Produto,              // ✅ AQUI
      LancamentoFinanceiro,
    ]),
  ],
  providers: [PlanoCorteService],
  controllers: [PlanoCorteController],
})
export class PlanoCorteModule {}

