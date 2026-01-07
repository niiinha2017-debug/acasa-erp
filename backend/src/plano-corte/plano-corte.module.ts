import { Module } from '@nestjs/common';
import { PlanoCorteService } from './plano-corte.service';
import { PlanoCorteController } from './plano-corte.controller';

@Module({
  controllers: [PlanoCorteController],
  providers: [PlanoCorteService],
})
export class PlanoCorteModule {}
