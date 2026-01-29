import { Module } from '@nestjs/common'
import { ArquivosController } from './arquivos.controller'
import { ArquivosService } from './arquivos.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [ArquivosController],
  providers: [ArquivosService, PrismaService],
  exports: [ArquivosService],
})
export class ArquivosModule {}
