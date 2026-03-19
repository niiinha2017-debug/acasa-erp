import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgendaModule } from '../agenda/agenda.module';
import { MedicaoFinaService } from './medicao-fina.service';
import { MedicaoFinaController } from './medicao-fina.controller';

@Module({
  imports: [PrismaModule, AgendaModule],
  controllers: [MedicaoFinaController],
  providers: [MedicaoFinaService],
  exports: [MedicaoFinaService],
})
export class MedicaoFinaModule {}
