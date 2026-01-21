import {
  Body, Controller, Delete, Get, Param, Put, Post, UseGuards, HttpCode, HttpStatus
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'
import { UsuariosService } from './usuarios.service'
import { CriarUsuarioDto } from './dto/criar-usuario.dto'
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto'
import { AtualizarStatusDto } from './dto/atualizar-status.dto'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Get()
  @Permissoes('usuarios.ver')
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  @Permissoes('usuarios.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id))
  }

  @Post()
  @Permissoes('usuarios.criar')
  criar(@Body() dto: CriarUsuarioDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  @Permissoes('usuarios.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarUsuarioDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Put(':id/status')
  @Permissoes('usuarios.editar')
  atualizarStatus(@Param('id') id: string, @Body() dto: AtualizarStatusDto) {
    return this.service.atualizarStatus(this.cleanId(id), dto.status)
  }

  @Delete(':id')
  @Permissoes('usuarios.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }
}
