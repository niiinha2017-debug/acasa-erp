import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Put, // Padronizado: Put para edições
  Post, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
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
      fornecedor_id: fornecedor_id ? Number(fornecedor_id.toString().replace(/\D/g, '')) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get('contas-pagar/:id')
  buscarPagar(@Param('id') id: string) {
    return this.service.buscarContaPagar(Number(id.replace(/\D/g, '')))
  }

  @Post('contas-pagar')
  criarPagar(@Body() dto: CriarContaPagarDto) {
    return this.service.criarContaPagar(dto)
  }

  @Put('contas-pagar/:id') // Alterado Patch -> Put
  atualizarPagar(@Param('id') id: string, @Body() dto: AtualizarContaPagarDto) {
    return this.service.atualizarContaPagar(Number(id.replace(/\D/g, '')), dto)
  }

  @Post('contas-pagar/:id/pagar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() dto: PagarContaPagarDto) {
    return this.service.pagarContaPagar(Number(id.replace(/\D/g, '')), dto)
  }

  // ===== CONTAS A RECEBER =====
  @Get('contas-receber')
  listarReceber(@Query('fornecedor_id') fornecedor_id?: string, @Query('status') status?: string) {
    return this.service.listarContasReceber({
      fornecedor_id: fornecedor_id ? Number(fornecedor_id.toString().replace(/\D/g, '')) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get('contas-receber/:id')
  buscarReceber(@Param('id') id: string) {
    return this.service.buscarContaReceber(Number(id.replace(/\D/g, '')))
  }

  @Post('contas-receber')
  criarReceber(@Body() dto: CriarContaReceberDto) {
    return this.service.criarContaReceber(dto)
  }

  @Put('contas-receber/:id') // Alterado Patch -> Put
  atualizarReceber(@Param('id') id: string, @Body() dto: AtualizarContaReceberDto) {
    return this.service.atualizarContaReceber(Number(id.replace(/\D/g, '')), dto)
  }

  @Post('contas-receber/:id/receber')
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string, @Body() dto: ReceberContaReceberDto) {
    return this.service.receberContaReceber(Number(id.replace(/\D/g, '')), dto)
  }

  // ===== COMPENSAÇÃO (ABATIMENTO) =====
  @Post('fornecedores/:fornecedorId/compensar')
  @HttpCode(HttpStatus.OK)
  compensar(@Param('fornecedorId') fornecedorId: string, @Body() dto: CompensarFornecedorDto) {
    return this.service.compensarFornecedor(Number(fornecedorId.replace(/\D/g, '')), dto)
  }
}