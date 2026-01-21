import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financeiro/contas-pagar')
export class ContasPagarController {
  constructor(private readonly service: FinanceiroService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  // ✅ LISTA CONSOLIDADA = DESPESAS + COMPRAS
  @Get()
  @Permissoes('contas_pagar.ver')
  async listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
  ) {
    await this.service.atualizarVencidos()

    return this.service.listarContasPagarConsolidado({
      fornecedor_id: fornecedor_id ? this.cleanId(fornecedor_id) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get(':id')
  @Permissoes('contas_pagar.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaPagar(this.cleanId(id))
  }

  @Post()
  @Permissoes('contas_pagar.criar')
  criar(@Body() dto: any) {
    return this.service.criarContaPagar(dto)
  }

  @Put(':id')
  @Permissoes('contas_pagar.editar')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizarContaPagar(this.cleanId(id), dto)
  }

  @Post(':id/pagar')
  @Permissoes('contas_pagar.editar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() dto: any) {
    return this.service.pagarContaPagar(this.cleanId(id), dto)
  }
}
