import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ConstantesService } from './constantes.service'
import { CriarConstanteDto } from './dto/criar-constante.dto'
import { AtualizarConstanteDto } from './dto/atualizar-constante.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@UseGuards(JwtAuthGuard)
@Controller('constantes')
export class ConstantesController {
  constructor(private readonly service: ConstantesService) {}

  // GET /constantes?categoria=...&ativas=true
  @Get()
  listar(
    @Query('categoria') categoria?: string,
    @Query('ativas') ativas?: string,
  ) {
    const ativasBool =
      ativas === undefined ? undefined : ativas === 'true'

    return this.service.listar({ categoria, ativas: ativasBool })
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id)
  }

  // Escrita: só ADMIN
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  criar(@Body() dto: CriarConstanteDto) {
    return this.service.criar(dto)
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarConstanteDto) {
    return this.service.atualizar(id, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id)
  }
}
