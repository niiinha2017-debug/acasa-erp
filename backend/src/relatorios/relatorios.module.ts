import { Module } from '@nestjs/common';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { DreController } from './dre.controller';
import { DreDetalhadaController } from './dre-detalhada.controller';
import { DreDetalhadaService } from './dre-detalhada.service';

@Module({
  imports: [FinanceiroModule],
  controllers: [DreController, DreDetalhadaController],
  providers: [DreDetalhadaService],
  exports: [DreDetalhadaService],
})
export class RelatoriosModule {}
