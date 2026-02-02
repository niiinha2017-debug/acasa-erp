import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { PlanoCorteService } from '../service/plano-corte.service'
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto'

import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plano-corte')
export class PlanoCorteController {
  constructor(private readonly service: PlanoCorteService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Post()
  @Permissoes('plano_corte.criar')
  create(@Body() dto: CreatePlanoCorteDto) {
    return this.service.create(dto)
  }

  @Get()
  @Permissoes('plano_corte.ver')
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  @Permissoes('plano_corte.ver')
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.cleanId(id))
  }

  @Put(':id')
  @Permissoes('plano_corte.editar')
  update(@Param('id') id: string, @Body() dto: UpdatePlanoCorteDto) {
    return this.service.update(this.cleanId(id), dto)
  }

  @Delete(':id')
  @Permissoes('plano_corte.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(this.cleanId(id))
  }
}
