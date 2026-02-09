import { Module } from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { DespesasController } from './despesas.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DespesasController],
  providers: [DespesasService, PrismaService],
})
export class DespesasModule {}
