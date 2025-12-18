import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete
} from '@nestjs/common'
import { InsumoPlanoCorteService } from './insumo-plano-corte.service'

@Controller('insumos-plano-corte')
export class InsumoPlanoCorteController {
  constructor(
    private readonly service: InsumoPlanoCorteService
  ) {}

  @Post()
  criar(@Body() body: any) {
    return this.service.criar(body)
  }

  @Get('plano/:planoId')
  listarPorPlano(@Param('planoId') planoId: string) {
    return this.service.listarPorPlano(Number(planoId))
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id))
  }
}
