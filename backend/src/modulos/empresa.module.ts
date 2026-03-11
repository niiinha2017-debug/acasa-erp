// src/modulos/empresa/empresa.module.ts
import { Module } from '@nestjs/common';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [EvolutionModule],
  controllers: [EmpresaController],
  providers: [EmpresaService],
})
export class EmpresaModule {}
