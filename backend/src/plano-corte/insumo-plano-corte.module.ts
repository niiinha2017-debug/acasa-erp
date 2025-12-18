import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InsumoPlanoCorte } from './insumo-plano-corte.entity'
import { InsumoPlanoCorteService } from './insumo-plano-corte.service'
import { InsumoPlanoCorteController } from './insumo-plano-corte.controller'

@Module({
  imports: [TypeOrmModule.forFeature([InsumoPlanoCorte])],
  controllers: [InsumoPlanoCorteController],
  providers: [InsumoPlanoCorteService],
  exports: [InsumoPlanoCorteService]
})
export class InsumoPlanoCorteModule {}
