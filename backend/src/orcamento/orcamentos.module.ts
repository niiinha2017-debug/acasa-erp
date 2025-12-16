import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrcamentosService } from './orcamentos.service'
import { OrcamentosController } from './orcamentos.controller'
import { Orcamento } from './orcamento.entity'
import { OrcamentoAmbiente } from './orcamento-ambiente.entity'
import { OrcamentoOpcao } from './orcamento-opcao.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Orcamento,
      OrcamentoAmbiente,
      OrcamentoOpcao
    ])
  ],
  controllers: [OrcamentosController],
  providers: [OrcamentosService]
})
export class OrcamentosModule {}
