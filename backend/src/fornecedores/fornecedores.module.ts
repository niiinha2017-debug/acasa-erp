import { Module } from '@nestjs/common';
import { FornecedorController } from './fornecedores.controller';
import { FornecedorService } from './fornecedores.service';

@Module({
  controllers: [FornecedorController],
  providers: [FornecedorService],
})
export class FornecedorModule {}
