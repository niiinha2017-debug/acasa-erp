import { Module } from '@nestjs/common'
import { OrcamentosService } from './orcamentos.service'
import { OrcamentosController } from './orcamentos.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [OrcamentosController],
  providers: [OrcamentosService],
})
export class OrcamentosModule {}
