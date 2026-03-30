import { Module } from '@nestjs/common';
import { GarantiasService } from './garantias.service';
import { GarantiasController } from './garantias.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { EvolutionModule } from '../evolution/evolution.module';
import { RotaCustoViagemModule } from '../rota-custo-viagem/rota-custo-viagem.module';

@Module({
  imports: [PrismaModule, FinanceiroModule, EvolutionModule, RotaCustoViagemModule],
  controllers: [GarantiasController],
  providers: [GarantiasService],
  exports: [GarantiasService],
})
export class GarantiasModule {}
