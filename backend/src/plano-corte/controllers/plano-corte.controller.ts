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
import { PlanoCorteService } from '../service/plano-corte.service'
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto'

@Controller('plano-corte')
export class PlanoCorteController {
  constructor(private readonly service: PlanoCorteService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Post()
  create(@Body() dto: CreatePlanoCorteDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.cleanId(id))
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanoCorteDto) {
    return this.service.update(this.cleanId(id), dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(this.cleanId(id))
  }
}
