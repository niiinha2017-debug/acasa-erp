import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { ComprasService } from './compras.service'
import { CriarCompraDto } from './dto/criar-compra.dto'
import { AtualizarCompraDto } from './dto/atualizar-compra.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  @Get()
  @Permissoes('compras.ver')
  async listar(
    @Query('venda_id') venda_id?: string,
    @Query('tipo_compra') tipo_compra?: string,
  ) {
    return this.service.listar({
      venda_id: venda_id ? Number(venda_id.replace(/\D/g, '')) : undefined,
      tipo_compra: tipo_compra?.trim() || undefined,
    })
  }

  @Get(':id')
  @Permissoes('compras.ver')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(Number(id.replace(/\D/g, '')))
  }

  @Post()
  @Permissoes('compras.criar')
  criar(@Body() dto: CriarCompraDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  @Permissoes('compras.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarCompraDto) {
    return this.service.atualizar(Number(id.replace(/\D/g, '')), dto)
  }

  @Delete(':id')
  @Permissoes('compras.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id.replace(/\D/g, '')))
  }
}
