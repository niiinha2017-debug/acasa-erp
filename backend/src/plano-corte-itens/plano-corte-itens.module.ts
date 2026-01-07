import { Module } from '@nestjs/common';
import { PlanoCorteItensService } from './plano-corte-itens.service';
import { PlanoCorteItensController } from './plano-corte-itens.controller';

@Module({
  controllers: [PlanoCorteItensController],
  providers: [PlanoCorteItensService],
})
export class PlanoCorteItensModule {}
