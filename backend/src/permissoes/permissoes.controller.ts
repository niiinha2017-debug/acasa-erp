import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common'
import { PermissoesService } from './permissoes.service'
import { DefinirPermissoesUsuarioDto } from './dto/definir-permissoes-usuario.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard' // ajuste o caminho

@UseGuards(JwtAuthGuard)
@Controller()
export class PermissoesController {
  constructor(private readonly service: PermissoesService) {}

  @Get('permissoes')
  listarPermissoes() {
    return this.service.listarPermissoes()
  }

  @Get('usuarios/:id/permissoes')
  listarPermissoesDoUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.listarPermissoesDoUsuario(id)
  }

  @Put('usuarios/:id/permissoes')
  definirPermissoesDoUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DefinirPermissoesUsuarioDto,
  ) {
    return this.service.definirPermissoesDoUsuario(id, dto.permissoes || [])
  }
}
