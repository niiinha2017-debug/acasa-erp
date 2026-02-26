import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { AgendaLojaController } from './agenda-loja.controller';
import { AgendaFabricaController } from './agenda-fabrica.controller';
import { AgendaAutomaticoJob } from './agenda-automatico.job';

@Module({
  imports: [PrismaModule],
  controllers: [
    AgendaController,
    AgendaLojaController,
    AgendaFabricaController,
  ],
  providers: [AgendaService, AgendaAutomaticoJob],
  exports: [AgendaService],
})
export class AgendaModule {}
