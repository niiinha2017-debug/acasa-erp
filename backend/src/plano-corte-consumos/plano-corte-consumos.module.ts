import { Module } from '@nestjs/common';
import { PlanoCorteConsumosService } from './plano-corte-consumos.service';
import { PlanoCorteConsumosController } from './plano-corte-consumos.controller';

@Module({
  controllers: [PlanoCorteConsumosController],
  providers: [PlanoCorteConsumosService],
})
export class PlanoCorteConsumosModule {}
