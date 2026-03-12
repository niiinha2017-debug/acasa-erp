import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentoTecnicoController } from './orcamento-tecnico.controller';
import { OrcamentoTecnicoService } from './orcamento-tecnico.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrcamentoTecnicoController],
  providers: [OrcamentoTecnicoService],
  exports: [OrcamentoTecnicoService],
})
export class OrcamentoTecnicoModule {}
