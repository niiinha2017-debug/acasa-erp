import { Module } from '@nestjs/common'
import { ProducaoController } from './producao.controller'
import { ProducaoService } from './producao.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [ProducaoController],
  providers: [ProducaoService, PrismaService],
})
export class ProducaoModule {}
