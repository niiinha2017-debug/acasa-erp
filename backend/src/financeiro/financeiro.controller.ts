import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get('tipo')
  findByTipo(@Query('tipo') tipo: 'Pagar' | 'Receber') {
    return this.service.findByTipo(tipo)
  }
}
