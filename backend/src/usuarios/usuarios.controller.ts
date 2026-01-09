import { 
  Body, Controller, Delete, Get, Param, Put, Post, UseGuards, HttpCode, HttpStatus 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  /**
   * Função de limpeza de IDs para garantir que apenas números cheguem ao Service
   */
  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Get()
  @Roles('ADMIN')
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  @Roles('ADMIN')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id));
  }

  @Post()
  @Roles('ADMIN')
  criar(@Body() dto: CriarUsuarioDto) {
    return this.service.criar(dto);
  }

  @Put(':id') // Trocado Patch por Put para seguir o padrão de edição completa
  @Roles('ADMIN')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarUsuarioDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Put(':id/status') // Trocado Patch por Put para consistência
  @Roles('ADMIN')
  atualizarStatus(@Param('id') id: string, @Body() dto: AtualizarStatusDto) {
    return this.service.atualizarStatus(this.cleanId(id), dto.status);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorno 204 para exclusão bem-sucedida
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }
}