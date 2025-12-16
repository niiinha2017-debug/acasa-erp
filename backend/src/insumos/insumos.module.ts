import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Insumo } from './insumo.entity'
import { EntradaInsumo } from './entrada-insumo.entity'
import { ConsumoInsumo } from './consumo-insumo.entity'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'

import { InsumosService } from './insumos.service'
import { InsumosController } from './insumos.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Insumo,
      EntradaInsumo,
      ConsumoInsumo,
      LancamentoFinanceiro,
    ]),
  ],
  controllers: [InsumosController],
  providers: [InsumosService],
})
export class InsumosModule {}
