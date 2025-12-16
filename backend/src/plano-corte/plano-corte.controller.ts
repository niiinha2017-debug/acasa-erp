import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { PlanoCorteService } from './plano-corte.service'

@Controller('planos-corte')
export class PlanoCorteController {
  constructor(private readonly service: PlanoCorteService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id))
  }
}
