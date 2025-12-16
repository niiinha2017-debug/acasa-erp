import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Venda } from './venda.entity'
import { AmbienteVenda } from './ambiente-venda.entity'
import { ItemVenda } from './item-venda.entity'
import { VendasService } from './vendas.service'
import { VendasController } from './vendas.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venda,
      AmbienteVenda,
      ItemVenda
    ])
  ],
  controllers: [VendasController],
  providers: [VendasService],
})
export class VendasModule {}

