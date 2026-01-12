import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService) {}

  // ===== CONTAS A PAGAR (CONSOLIDADO) =====
  @Get('contas-pagar')
  async listarPagar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
  ) {
    await this.service.atualizarVencidos()

    return this.service.listarContasPagarConsolidado({
      fornecedor_id: fornecedor_id ? Number(String(fornecedor_id).replace(/\D/g, '')) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get('contas-pagar/:id')
  buscarPagar(@Param('id') id: string) {
    return this.service.buscarContaPagar(Number(String(id).replace(/\D/g, '')))
  }

  @Post('contas-pagar')
  criarPagar(@Body() body: any) {
    return this.service.criarContaPagar(body)
  }

  @Put('contas-pagar/:id')
  atualizarPagar(@Param('id') id: string, @Body() body: any) {
    return this.service.atualizarContaPagar(Number(String(id).replace(/\D/g, '')), body)
  }

  @Post('contas-pagar/:id/pagar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() body: any) {
    return this.service.pagarContaPagar(Number(String(id).replace(/\D/g, '')), body)
  }

  // ===== CONTAS A RECEBER =====
  @Get('contas-receber')
  listarReceber(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listarContasReceber({
      fornecedor_id: fornecedor_id ? Number(String(fornecedor_id).replace(/\D/g, '')) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get('contas-receber/:id')
  buscarReceber(@Param('id') id: string) {
    return this.service.buscarContaReceber(Number(String(id).replace(/\D/g, '')))
  }

  @Post('contas-receber')
  criarReceber(@Body() body: any) {
    return this.service.criarContaReceber(body)
  }

  @Put('contas-receber/:id')
  atualizarReceber(@Param('id') id: string, @Body() body: any) {
    return this.service.atualizarContaReceber(Number(String(id).replace(/\D/g, '')), body)
  }

  @Post('contas-receber/:id/receber')
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string, @Body() body: any) {
    return this.service.receberContaReceber(Number(String(id).replace(/\D/g, '')), body)
  }

  // ===== COMPENSAÇÃO (ABATIMENTO) =====
  @Post('fornecedores/:fornecedorId/compensar')
  @HttpCode(HttpStatus.OK)
  compensar(@Param('fornecedorId') fornecedorId: string, @Body() body: any) {
    return this.service.compensarFornecedor(Number(String(fornecedorId).replace(/\D/g, '')), body)
  }
}
