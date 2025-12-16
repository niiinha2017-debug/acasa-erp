import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AgendaService } from './agenda.service'
import { AgendaController } from './agenda.controller'
import { AgendaProducao } from './agenda-producao.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AgendaProducao])],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
