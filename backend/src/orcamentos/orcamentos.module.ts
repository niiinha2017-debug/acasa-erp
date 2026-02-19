import { Module } from '@nestjs/common';
import { OrcamentosService } from './orcamentos.service';
import { OrcamentosController } from './orcamentos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClausulasModule } from '../clausulas/clausulas.module';

@Module({
  imports: [PrismaModule, ClausulasModule],
  controllers: [OrcamentosController],
  providers: [OrcamentosService],
})
export class OrcamentosModule {}
