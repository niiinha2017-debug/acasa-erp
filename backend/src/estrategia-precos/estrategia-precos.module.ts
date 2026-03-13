import { Module } from '@nestjs/common';
import { EstrategiaPrecosController } from './estrategia-precos.controller';
import { EstrategiaPrecosService } from './estrategia-precos.service';

@Module({
  controllers: [EstrategiaPrecosController],
  providers: [EstrategiaPrecosService],
  exports: [EstrategiaPrecosService],
})
export class EstrategiaPrecosModule {}
