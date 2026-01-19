import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import { PlanoCorteConsumosService } from '../service/plano-corte-consumos.service'
import { CreatePlanoCorteConsumoDto } from '../dto/create-plano-corte-consumo.dto'
import { UpdatePlanoCorteConsumoDto } from '../dto/update-plano-corte-consumo.dto'

@Controller('plano-corte-consumos')
export class PlanoCorteConsumosController {
  constructor(private readonly service: PlanoCorteConsumosService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Post()
  criar(@Body() dto: CreatePlanoCorteConsumoDto) {
    return this.service.criar(dto)
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscar(this.cleanId(id))
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdatePlanoCorteConsumoDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }
}
