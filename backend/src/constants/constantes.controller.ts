import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common'
import { ConstantesService } from './constantes.service'

@Controller('constantes')
export class ConstantesController {
  constructor(private readonly service: ConstantesService) {}

  @Get()
  find(
    @Query('grupo') grupo?: string,
    @Query('ativo') ativo?: string,
  ) {
    const ativoBool =
      ativo === undefined ? undefined : ativo === '1' || ativo === 'true'

    return this.service.find(grupo, ativoBool)
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(Number(id), body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
