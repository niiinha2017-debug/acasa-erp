import { Module } from '@nestjs/common';
import { ArquivosController } from './arquivos.controller';
import { ArquivosService } from './arquivos.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExtractionModule } from '../extraction/extraction.module';
import { AgendaModule } from '../agenda/agenda.module';

@Module({
  imports: [ExtractionModule, AgendaModule],
  controllers: [ArquivosController],
  providers: [ArquivosService, PrismaService],
  exports: [ArquivosService],
})
export class ArquivosModule {}
