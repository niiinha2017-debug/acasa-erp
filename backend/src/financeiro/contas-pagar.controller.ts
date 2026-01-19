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
} from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro/contas-pagar')
export class ContasPagarController {
  constructor(private readonly service: FinanceiroService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  // ✅ LISTA CONSOLIDADA = DESPESAS + COMPRAS
  @Get()
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

  // ====== (se ainda usa a tabela contas_pagar) ======
  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaPagar(this.cleanId(id))
  }

  @Post()
  criar(@Body() dto: any) {
    return this.service.criarContaPagar(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizarContaPagar(this.cleanId(id), dto)
  }

  @Post(':id/pagar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() dto: any) {
    return this.service.pagarContaPagar(this.cleanId(id), dto)
  }
}
