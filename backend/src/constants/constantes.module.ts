import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Constante } from './constantes.entity'
import { ConstantesService } from './constantes.service'
import { ConstantesController } from './constantes.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Constante])],
  controllers: [ConstantesController],
  providers: [ConstantesService],
  exports: [ConstantesService],
})
export class ConstantesModule {}
