import { Module } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { DespesasController } from './despesas.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EstrategiaPrecosModule } from '../estrategia-precos/estrategia-precos.module';

@Module({
  imports: [EstrategiaPrecosModule],
  controllers: [DespesasController],
  providers: [DespesasService, PrismaService],
  exports: [DespesasService],
})
export class DespesasModule {}
