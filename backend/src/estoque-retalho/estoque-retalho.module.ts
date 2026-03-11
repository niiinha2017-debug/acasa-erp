import { Module } from '@nestjs/common';
import { EstoqueRetalhoController } from './estoque-retalho.controller';
import { EstoqueRetalhoService } from './estoque-retalho.service';

@Module({
  controllers: [EstoqueRetalhoController],
  providers: [EstoqueRetalhoService],
  exports: [EstoqueRetalhoService],
})
export class EstoqueRetalhoModule {}
