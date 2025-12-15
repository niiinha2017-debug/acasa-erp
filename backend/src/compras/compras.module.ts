import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ComprasController } from './compras.controller'
import { ComprasService } from './compras.service'
import { Compra } from './compra.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Compra]),
  ],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
