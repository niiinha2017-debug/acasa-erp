import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroService } from './financeiro.service';
import { CustosEstruturaService } from './custos-estrutura.service';
import { RotaCustoViagemModule } from '../rota-custo-viagem/rota-custo-viagem.module';

import { ContasPagarController } from './contas-pagar.controller';
import { ContasReceberController } from './contas-receber.controller';
import { FechamentoController } from './fechamento.controller';
import { CustosEstruturaController } from './custos-estrutura.controller';

@Module({
  imports: [RotaCustoViagemModule],
  controllers: [
    ContasPagarController,
    ContasReceberController,
    FechamentoController,
    CustosEstruturaController,
  ],
  providers: [FinanceiroService, CustosEstruturaService],
  exports: [FinanceiroService, CustosEstruturaService],
})
export class FinanceiroModule {}
