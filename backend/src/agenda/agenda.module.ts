import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AgendaService } from './agenda.service'

@Module({
  imports: [PrismaModule],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
