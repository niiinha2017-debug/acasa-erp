import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common'
import { PermissoesService } from './permissoes.service'
import { DefinirPermissoesUsuarioDto } from './dto/definir-permissoes-usuario.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PermissoesController {
  constructor(private readonly service: PermissoesService) {}

  @Get('permissoes')
  @Permissoes('permissoes.ver')
  listarPermissoes() {
    return this.service.listarPermissoes()
  }

  @Get('usuarios/:id/permissoes')
  @Permissoes('permissoes.ver')
  listarPermissoesDoUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.listarPermissoesDoUsuario(id)
  }

  @Put('usuarios/:id/permissoes')
  @Permissoes('permissoes.editar')
  definirPermissoesDoUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DefinirPermissoesUsuarioDto,
  ) {
    return this.service.definirPermissoesDoUsuario(id, dto.permissoes || [])
  }
}
