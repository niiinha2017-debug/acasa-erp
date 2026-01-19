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
import { DespesasService } from './despesas.service'
import { CreateDespesaDto } from './dto/create-despesa.dto'
import { UpdateDespesaDto } from './dto/update-despesa.dto'

@Controller('despesas')
export class DespesasController {
  constructor(private readonly service: DespesasService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('unidade') unidade?: string,
    @Query('tipo_movimento') tipo_movimento?: string,
  ) {
    return this.service.findAll({
      status: status?.trim() || undefined,
      unidade: unidade?.trim() || undefined,
      tipo_movimento: tipo_movimento?.trim() || undefined,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.findOne(cleanId)
  }

  @Post()
  create(@Body() dto: CreateDespesaDto) {
    return this.service.create(dto)
  }

  @Put('recorrencia/:recorrenciaId')
  updateRecorrencia(
    @Param('recorrenciaId') recorrenciaId: string,
    @Body() dto: UpdateDespesaDto,
  ) {
    return this.service.updateRecorrencia(recorrenciaId, dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDespesaDto) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.update(cleanId, dto)
  }

  @Delete('recorrencia/:recorrenciaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRecorrencia(@Param('recorrenciaId') recorrenciaId: string) {
    return this.service.removeRecorrencia(recorrenciaId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.remove(cleanId)
  }
}
