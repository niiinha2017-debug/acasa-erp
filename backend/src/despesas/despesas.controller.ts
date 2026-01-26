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
  UseGuards,
} from '@nestjs/common'
import { DespesasService } from './despesas.service'
import { CreateDespesaDto } from './dto/create-despesa.dto'
import { UpdateDespesaDto } from './dto/update-despesa.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly service: DespesasService) {}

  @Get()
  @Permissoes('despesas.ver')
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
  @Permissoes('despesas.ver')
  findOne(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.findOne(cleanId)
  }

  @Post()
  @Permissoes('despesas.criar')
  create(@Body() dto: CreateDespesaDto) {
    return this.service.create(dto)
  }

  @Put('recorrencia/:recorrenciaId')
  @Permissoes('despesas.editar')
  updateRecorrencia(
    @Param('recorrenciaId') recorrenciaId: string,
    @Body() dto: UpdateDespesaDto,
  ) {
    return this.service.updateRecorrencia(recorrenciaId, dto)
  }

  @Put(':id')
  @Permissoes('despesas.editar')
  update(@Param('id') id: string, @Body() dto: UpdateDespesaDto) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.update(cleanId, dto)
  }

@Delete('recorrencia/:recorrenciaId')
@Permissoes('despesas.excluir')
removeRecorrencia(@Param('recorrenciaId') recorrenciaId: string) {
  return this.service.removeRecorrencia(recorrenciaId)
}


@Delete(':id')
@Permissoes('despesas.excluir')
remove(@Param('id') id: string) {
  const cleanId = Number(id.replace(/\D/g, ''))
  return this.service.remove(cleanId)
}

}
