import { Module } from '@nestjs/common';
import { GarantiasService } from './garantias.service';
import { GarantiasController } from './garantias.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceiroModule } from '../financeiro/financeiro.module';

@Module({
  imports: [PrismaModule, FinanceiroModule],
  controllers: [GarantiasController],
  providers: [GarantiasService],
  exports: [GarantiasService],
})
export class GarantiasModule {}
