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
import { VendasService } from './vendas.service'
import { CreateVendaDto } from './dto/create-venda.dto'
import { UpdateVendaDto } from './dto/update-venda.dto'
import { UpdateVendaStatusDto } from './dto/update-venda-status.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vendas')
export class VendasController {
  constructor(private readonly service: VendasService) {}

  private cleanId(id: string | number): number {
    const n = Number(String(id || '').replace(/\D/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  @Get()
  @Permissoes('vendas.ver')
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  @Permissoes('vendas.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id))
  }

  @Post()
  @Permissoes('vendas.criar')
  criar(@Body() dto: CreateVendaDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  @Permissoes('vendas.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateVendaDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Put(':id/status')
  @Permissoes('vendas.editar')
  atualizarStatus(@Param('id') id: string, @Body() dto: UpdateVendaStatusDto) {
    return this.service.atualizarStatus(this.cleanId(id), dto.status)
  }

  @Delete(':id')
  @Permissoes('vendas.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }

  @Post(':id/enviar-producao')
@Permissoes('vendas.editar')
enviarProducao(@Param('id', ParseIntPipe) id: number) {
  return this.service.enviarParaProducao(id)
}

}
