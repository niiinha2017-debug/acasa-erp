import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards
} from '@nestjs/common'
import { ConstantesService } from './constantes.service'
import { CriarConstanteDto } from './dto/criar-constante.dto'
import { AtualizarConstanteDto } from './dto/atualizar-constante.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@Controller('constantes')
export class ConstantesController {
  constructor(private readonly service: ConstantesService) {}

  // GET /constantes?categoria=...&ativas=true  (ABERTO)
  @Get()
  listar(
    @Query('categoria') categoria?: string,
    @Query('ativas') ativas?: string,
  ) {
    const ativasBool = ativas === undefined ? undefined : ativas === 'true'
    return this.service.listar({ categoria, ativas: ativasBool })
  }

  // GET /constantes/:id (ABERTO)
  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id)
  }

  // POST (PROTEGIDO)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissoes('constantes.criar')
  @Post()
  criar(@Body() dto: CriarConstanteDto) {
    return this.service.criar(dto)
  }

  // PATCH (PROTEGIDO)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissoes('constantes.editar')
  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarConstanteDto,
  ) {
    return this.service.atualizar(id, dto)
  }

  // DELETE (PROTEGIDO)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissoes('constantes.excluir')
  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id)
  }
}
