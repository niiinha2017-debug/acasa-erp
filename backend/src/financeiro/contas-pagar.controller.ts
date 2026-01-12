import { Body, Controller, Get, Param, Post, Put, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro/contas-pagar')
export class ContasPagarController {
  constructor(private readonly service: FinanceiroService) {}

  // ✅ LISTA CONSOLIDADA = DESPESAS + COMPRAS
  @Get()
  async listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
  ) {
    await this.service.atualizarVencidos()

    return this.service.listarContasPagarConsolidado({
      fornecedor_id: fornecedor_id ? Number(String(fornecedor_id).replace(/\D/g, '')) : undefined,
      status: status?.trim() || undefined,
    })
  }

  // ====== (se ainda usa a tabela contas_pagar) ======
  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaPagar(Number(String(id).replace(/\D/g, '')))
  }

  @Post()
  criar(@Body() dto: any) {
    return this.service.criarContaPagar(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizarContaPagar(Number(String(id).replace(/\D/g, '')), dto)
  }

  @Post(':id/pagar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() dto: any) {
    return this.service.pagarContaPagar(Number(String(id).replace(/\D/g, '')), dto)
  }
}
