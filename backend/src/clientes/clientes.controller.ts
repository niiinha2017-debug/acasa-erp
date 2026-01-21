import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { ClientesService } from './clientes.service'
import { CriarClienteDto } from './dto/criar-cliente.dto'
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  @Permissoes('clientes.criar')
  criar(@Body() dto: CriarClienteDto) {
    return this.service.criar(dto)
  }

  @Get()
  @Permissoes('clientes.ver')
  listar() {
    return this.service.listar()
  }

  // Rotas de relatórios antes do :id (ok)
  @Get('relatorios/aniversariantes')
  @Permissoes('clientes.ver') // (ou 'clientes.relatorios' se você tiver essa chave)
  aniversariantes(
    @Query('data') data?: string,
    @Query('enviar') enviar?: 'email' | 'whatsapp',
  ) {
    const hoje = new Date().toISOString().slice(0, 10)
    return this.service.aniversariantesDoDia(data ?? hoje, enviar)
  }

  @Get(':id')
  @Permissoes('clientes.ver')
  buscar(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.buscarPorId(cleanId)
  }

  @Put(':id')
  @Permissoes('clientes.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarClienteDto) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.atualizar(cleanId, dto)
  }

  @Delete(':id')
  @Permissoes('clientes.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.remover(cleanId)
  }
}
