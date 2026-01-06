import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard'; // Importe o seu novo vigia
import { Roles } from '../auth/roles.decorator';   // Importe a sua etiqueta
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard) // Proteção global para este controller
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  @Roles('ADMIN') // SÓ ADMIN vê a lista de todos os usuários
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  @Roles('ADMIN') 
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN') // Só ADMIN cria novos usuários (ou aproveite para deixar público se for cadastro)
  criar(@Body() dto: CriarUsuarioDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarUsuarioDto) {
    return this.service.atualizar(id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN') // Crucial: Só ADMIN aprova ou bloqueia outros usuários
  atualizarStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarStatusDto) {
    return this.service.atualizarStatus(id, dto.status);
  }
  @Delete(':id')
@Roles('ADMIN') // Segurança: Somente o ADMIN pode deletar usuários
remover(@Param('id', ParseIntPipe) id: number) {
  return this.service.remover(id);
}
}