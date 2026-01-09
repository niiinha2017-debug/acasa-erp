import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'
import { CriarContaPagarDto } from './dto/criar-conta-pagar.dto'
import { AtualizarContaPagarDto } from './dto/atualizar-conta-pagar.dto'
import { PagarContaPagarDto } from './dto/pagar-conta-pagar.dto'
import { CriarContaReceberDto } from './dto/criar-conta-receber.dto'
import { AtualizarContaReceberDto } from './dto/atualizar-conta-receber.dto'
import { ReceberContaReceberDto } from './dto/receber-conta-receber.dto'
import { CompensarFornecedorDto } from './dto/compensar-fornecedor.dto'

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService) {}

  // ===== CONTAS A PAGAR =====
  @Get('contas-pagar')
  listarPagar(@Query('fornecedor_id') fornecedor_id?: string, @Query('status') status?: string) {
    return this.service.listarContasPagar({
      fornecedor_id: fornecedor_id ? Number(fornecedor_id) : undefined,
      status: status || undefined,
    })
  }

  @Get('contas-pagar/:id')
  buscarPagar(@Param('id') id: string) {
    return this.service.buscarContaPagar(Number(id))
  }

  @Post('contas-pagar')
  criarPagar(@Body() dto: CriarContaPagarDto) {
    return this.service.criarContaPagar(dto)
  }

  @Patch('contas-pagar/:id')
  atualizarPagar(@Param('id') id: string, @Body() dto: AtualizarContaPagarDto) {
    return this.service.atualizarContaPagar(Number(id), dto)
  }

  @Post('contas-pagar/:id/pagar')
  pagar(@Param('id') id: string, @Body() dto: PagarContaPagarDto) {
    return this.service.pagarContaPagar(Number(id), dto)
  }

  // ===== CONTAS A RECEBER =====
  @Get('contas-receber')
  listarReceber(@Query('fornecedor_id') fornecedor_id?: string, @Query('status') status?: string) {
    return this.service.listarContasReceber({
      fornecedor_id: fornecedor_id ? Number(fornecedor_id) : undefined,
      status: status || undefined,
    })
  }

  @Get('contas-receber/:id')
  buscarReceber(@Param('id') id: string) {
    return this.service.buscarContaReceber(Number(id))
  }

  @Post('contas-receber')
  criarReceber(@Body() dto: CriarContaReceberDto) {
    return this.service.criarContaReceber(dto)
  }

  @Patch('contas-receber/:id')
  atualizarReceber(@Param('id') id: string, @Body() dto: AtualizarContaReceberDto) {
    return this.service.atualizarContaReceber(Number(id), dto)
  }

  @Post('contas-receber/:id/receber')
  receber(@Param('id') id: string, @Body() dto: ReceberContaReceberDto) {
    return this.service.receberContaReceber(Number(id), dto)
  }

  // ===== COMPENSAÇÃO (ABATIMENTO) =====
  @Post('fornecedores/:fornecedorId/compensar')
  compensar(@Param('fornecedorId') fornecedorId: string, @Body() dto: CompensarFornecedorDto) {
    return this.service.compensarFornecedor(Number(fornecedorId), dto)
  }
}
