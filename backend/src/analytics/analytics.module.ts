import { Module } from '@nestjs/common';
import { PontoModule } from '../ponto/ponto.module';
import { RotaCustoViagemModule } from '../rota-custo-viagem/rota-custo-viagem.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { FeriadosService } from './feriados.service';
import { QuickChartService } from './quickchart.service';

@Module({
  imports: [PontoModule, RotaCustoViagemModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, QuickChartService, FeriadosService],
})
export class AnalyticsModule {}
