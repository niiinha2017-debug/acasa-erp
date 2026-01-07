import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { PlanoCorteItensService } from './plano-corte-itens.service'
import { CreatePlanoCorteItemDto } from './dto/create-plano-corte-iten.dto'
import { UpdatePlanoCorteItemDto } from './dto/update-plano-corte-iten.dto'

@Controller('plano-corte-itens')
export class PlanoCorteItensController {
  constructor(private readonly service: PlanoCorteItensService) {}

  @Post()
  create(@Body() dto: CreatePlanoCorteItemDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query('fornecedor_id') fornecedor_id?: string) {
    return this.service.findAll(fornecedor_id ? Number(fornecedor_id) : undefined)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanoCorteItemDto) {
    return this.service.update(+id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id)
  }
}
