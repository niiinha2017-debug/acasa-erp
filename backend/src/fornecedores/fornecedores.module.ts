// backend/src/fornecedores/fornecedores.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 1. Importar TypeOrmModule
import { Fornecedor } from './fornecedor.entity'; // 2. Importar a Entidade
import { FornecedoresService } from './fornecedores.service';
import { FornecedoresController } from './fornecedores.controller';

@Module({
  imports: [
    // 🛑 CORREÇÃO AQUI: Diga ao módulo para gerenciar a entidade Fornecedor
    TypeOrmModule.forFeature([Fornecedor]), 
  ],
  controllers: [FornecedoresController],
  providers: [FornecedoresService],
})
export class FornecedoresModule {}