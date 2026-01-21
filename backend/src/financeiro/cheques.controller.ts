import {
  Controller,
  Get,
  Param,
  Put,
  Query,
  ParseIntPipe,
  Body,
  UseGuards,
} from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financeiro/cheques')
export class ChequesController {
  constructor(private readonly service: FinanceiroService) {}

  @Get()
  @Permissoes('cheques.ver')
  async listar(
    @Query('status') status?: string,
    @Query('banco') banco?: string,
  ) {
    return this.service.listarCheques({ status, banco })
  }

  @Get(':id')
  @Permissoes('cheques.ver')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarChequePorId(id)
  }

  @Put(':id/compensar')
  @Permissoes('cheques.editar')
  async compensar(@Param('id', ParseIntPipe) id: number) {
    return this.service.atualizarStatusCheque(id, 'COMPENSADO')
  }

  @Put(':id/devolver')
  @Permissoes('cheques.editar')
  async devolver(@Param('id', ParseIntPipe) id: number) {
    return this.service.atualizarStatusCheque(id, 'DEVOLVIDO')
  }

  @Put(':id/status')
  @Permissoes('cheques.editar')
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.service.atualizarStatusCheque(
      id,
      String(body.status || '').trim(),
    )
  }
}
