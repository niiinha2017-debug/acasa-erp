import { Controller, Post, Body } from '@nestjs/common'
import { PlanoCorteConsumosService } from './plano-corte-consumos.service'
import { CreatePlanoCorteConsumoDto } from './dto/create-plano-corte-consumo.dto'

@Controller('plano-corte-consumos')
export class PlanoCorteConsumosController {
  constructor(private readonly service: PlanoCorteConsumosService) {}

  @Post()
  create(@Body() dto: CreatePlanoCorteConsumoDto) {
    return this.service.create(dto)
  }
}
