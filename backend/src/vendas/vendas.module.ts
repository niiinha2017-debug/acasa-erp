import { Module } from '@nestjs/common';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AgendaModule } from '../agenda/agenda.module';
import { EstoqueModule } from '../estoque/estoque.module';

@Module({
  imports: [PrismaModule, AgendaModule, EstoqueModule],
  controllers: [VendasController],
  providers: [VendasService],
})
export class VendasModule {}
