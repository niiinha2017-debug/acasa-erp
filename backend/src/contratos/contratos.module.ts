import { Module } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClausulasModule } from '../clausulas/clausulas.module';

@Module({
  imports: [PrismaModule, ClausulasModule],
  controllers: [ContratosController],
  providers: [ContratosService],
})
export class ContratosModule {}
