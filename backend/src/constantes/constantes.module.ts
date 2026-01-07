import { Module } from '@nestjs/common'
import { ConstantesController } from './constantes.controller'
import { ConstantesService } from './constantes.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  controllers: [ConstantesController],
  providers: [ConstantesService, PrismaService],
})
export class ConstantesModule {}
