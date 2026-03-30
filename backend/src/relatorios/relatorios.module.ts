import { Module } from '@nestjs/common';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RotaCustoViagemModule } from '../rota-custo-viagem/rota-custo-viagem.module';
import { DreController } from './dre.controller';
import { DreDetalhadaController } from './dre-detalhada.controller';
import { RelatorioTotemController } from './relatorio-totem.controller';
import { RelatorioServicosCorteController } from './relatorio-servico-corte.controller';
import { RelatorioFluxoCaixaController } from './relatorio-fluxo-caixa.controller';
import { DreDetalhadaService } from './dre-detalhada.service';
import { RelatorioTotemService } from './relatorio-totem.service';

@Module({
  imports: [FinanceiroModule, PrismaModule, RotaCustoViagemModule],
  controllers: [DreController, DreDetalhadaController, RelatorioTotemController, RelatorioServicosCorteController, RelatorioFluxoCaixaController],
  providers: [DreDetalhadaService, RelatorioTotemService],
  exports: [DreDetalhadaService, RelatorioTotemService],
})
export class RelatoriosModule {}
