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
  UseGuards,
} from '@nestjs/common'
import { PlanoCorteConsumosService } from '../service/plano-corte-consumos.service'
import { CreatePlanoCorteConsumoDto } from '../dto/create-plano-corte-consumo.dto'
import { UpdatePlanoCorteConsumoDto } from '../dto/update-plano-corte-consumo.dto'

import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plano-corte-consumos')
export class PlanoCorteConsumosController {
  constructor(private readonly service: PlanoCorteConsumosService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Post()
  @Permissoes('plano_corte.criar')
  criar(@Body() dto: CreatePlanoCorteConsumoDto) {
    return this.service.criar(dto)
  }

  @Get()
  @Permissoes('plano_corte.ver')
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  @Permissoes('plano_corte.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscar(this.cleanId(id))
  }

  @Put(':id')
  @Permissoes('plano_corte.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdatePlanoCorteConsumoDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Delete(':id')
  @Permissoes('plano_corte.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }
}
