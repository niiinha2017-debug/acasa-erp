import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EstoqueRetalhoModule } from '../estoque-retalho/estoque-retalho.module';
import { AgendaModule } from '../agenda/agenda.module';
import { MedicaoFinaModule } from '../medicao-fina/medicao-fina.module';
import { ApontamentoProducaoService } from './apontamento-producao.service';
import { ApontamentoProducaoController } from './apontamento-producao.controller';
import { TotemFabricaController } from '../totem-fabrica/totem-fabrica.controller';
@Module({
  imports: [PrismaModule, EstoqueRetalhoModule, AgendaModule, MedicaoFinaModule],
  controllers: [ApontamentoProducaoController, TotemFabricaController],
  providers: [ApontamentoProducaoService],
  exports: [ApontamentoProducaoService],
})
export class ApontamentoProducaoModule {}
