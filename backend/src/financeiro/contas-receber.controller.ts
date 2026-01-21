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
@Controller('financeiro/contas-receber')
export class ContasReceberController {
  constructor(private readonly service: FinanceiroService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  @Get()
  @Permissoes('contas_receber.ver')
  listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listarContasReceber({
      fornecedor_id: fornecedor_id ? this.cleanId(fornecedor_id) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get(':id')
  @Permissoes('contas_receber.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaReceber(this.cleanId(id))
  }

  @Post()
  @Permissoes('contas_receber.criar')
  criar(@Body() dto: any) {
    return this.service.criarContaReceber(dto)
  }

  @Put(':id')
  @Permissoes('contas_receber.editar')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizarContaReceber(this.cleanId(id), dto)
  }

  @Post(':id/receber')
  @Permissoes('contas_receber.editar')
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string, @Body() dto: any) {
    return this.service.receberContaReceber(this.cleanId(id), dto)
  }
}
