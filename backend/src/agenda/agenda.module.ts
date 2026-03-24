import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { AgendaLojaController } from './agenda-loja.controller';
import { AgendaFabricaController } from './agenda-fabrica.controller';
import { AgendaGeralController } from './agenda-geral.controller';
import { AgendaAutomaticoJob } from './agenda-automatico.job';
import { TwinFlowService } from './twin-flow.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AgendaController,
    AgendaLojaController,
    AgendaFabricaController,
    AgendaGeralController,
  ],
  providers: [AgendaService, AgendaAutomaticoJob, TwinFlowService],
  exports: [AgendaService, TwinFlowService],
})
export class AgendaModule {}
