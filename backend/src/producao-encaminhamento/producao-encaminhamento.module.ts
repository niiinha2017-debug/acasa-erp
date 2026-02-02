import { Module } from '@nestjs/common'
import { ProducaoEncaminhamentoController } from './producao-encaminhamento.controller'
import { ProducaoEncaminhamentoService } from './producao-encaminhamento.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [ProducaoEncaminhamentoController],
  providers: [ProducaoEncaminhamentoService, PrismaService],
})
export class ProducaoEncaminhamentoModule {}
