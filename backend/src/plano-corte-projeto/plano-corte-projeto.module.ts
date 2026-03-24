import { Module } from '@nestjs/common';
import { PlanoCorteProjetoService } from './plano-corte-projeto.service';

@Module({
  providers: [PlanoCorteProjetoService],
  exports: [PlanoCorteProjetoService],
})
export class PlanoCorteProjetoModule {}
