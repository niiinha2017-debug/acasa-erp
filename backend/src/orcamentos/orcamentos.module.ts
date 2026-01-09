import { Module } from '@nestjs/common'
import { OrcamentosService } from './orcamentos.service'
import { OrcamentosController } from './orcamentos.controller'

@Module({
  controllers: [OrcamentosController],
  providers: [OrcamentosService],
})
export class OrcamentosModule {}
