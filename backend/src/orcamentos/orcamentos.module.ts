import { Module } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { OrcamentosController } from './orcamentos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClausulasModule } from '../clausulas/clausulas.module';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [PrismaModule, ClausulasModule, EvolutionModule],
  controllers: [OrcamentosController],
  providers: [OrcamentosService],
})
export class OrcamentosModule {}
