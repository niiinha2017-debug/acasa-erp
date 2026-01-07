import { Controller, Get, Post, Body } from '@nestjs/common'
import { PlanoCorteService } from './plano-corte.service'
import { CreatePlanoCorteDto } from './dto/create-plano-corte.dto'

@Controller('plano-corte')
export class PlanoCorteController {
  constructor(private readonly service: PlanoCorteService) {}

  @Post()
  create(@Body() dto: CreatePlanoCorteDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }
}
