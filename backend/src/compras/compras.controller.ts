import { Controller, Post, Body } from '@nestjs/common'
import { ComprasService } from './compras.service'

@Controller('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  @Post()
  criar(@Body() body: any) {
    return this.service.criarCompraCompleta(body)
  }
}

