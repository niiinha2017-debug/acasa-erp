import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
