import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Venda } from './entities/venda.entity'
import { AmbienteVenda } from './entities/ambiente-venda.entity'
import { ItemVenda } from './entities/item-venda.entity'
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

