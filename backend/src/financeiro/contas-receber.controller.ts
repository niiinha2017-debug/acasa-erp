import { Body, Controller, Get, Param, Post, Put, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro/contas-receber')
export class ContasReceberController {
  constructor(private readonly service: FinanceiroService) {}

  @Get()
  listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listarContasReceber({
      fornecedor_id: fornecedor_id ? Number(String(fornecedor_id).replace(/\D/g, '')) : undefined,
      status: status?.trim() || undefined,
    })
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaReceber(Number(String(id).replace(/\D/g, '')))
  }

  @Post()
  criar(@Body() dto: any) {
    return this.service.criarContaReceber(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizarContaReceber(Number(String(id).replace(/\D/g, '')), dto)
  }

  @Post(':id/receber')
  @HttpCode(HttpStatus.OK)
  receber(@Param('id') id: string, @Body() dto: any) {
    return this.service.receberContaReceber(Number(String(id).replace(/\D/g, '')), dto)
  }
}
