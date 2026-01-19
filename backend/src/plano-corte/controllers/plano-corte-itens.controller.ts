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
  Query,
} from '@nestjs/common'
import { PlanoCorteItensService } from '../service/plano-corte-itens.service'
import { CreatePlanoCorteItemDto } from '../dto/create-plano-corte-iten.dto'
import { UpdatePlanoCorteItemDto } from '../dto/update-plano-corte-iten.dto'

@Controller('plano-corte-itens')
export class PlanoCorteItensController {
  constructor(private readonly service: PlanoCorteItensService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Post()
  create(@Body() dto: CreatePlanoCorteItemDto) {
    return this.service.criar(dto)
  }

  @Get()
  findAll(@Query('fornecedor_id') fornecedor_id?: string) {
    const fId = fornecedor_id ? this.cleanId(fornecedor_id) : undefined
    return this.service.listar(fId)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanoCorteItemDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }
}
