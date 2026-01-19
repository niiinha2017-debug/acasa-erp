import { Controller, Get, Param, Put, Query, ParseIntPipe, Body } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro/cheques')
export class ChequesController {
  constructor(private readonly service: FinanceiroService) {}

  @Get()
  async listar(
    @Query('status') status?: string,
    @Query('banco') banco?: string,
  ) {
    return this.service.listarCheques({ status, banco })
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarChequePorId(id)
  }

  @Put(':id/compensar')
  async compensar(@Param('id', ParseIntPipe) id: number) {
    return this.service.atualizarStatusCheque(id, 'COMPENSADO')
  }

  @Put(':id/devolver')
  async devolver(@Param('id', ParseIntPipe) id: number) {
    return this.service.atualizarStatusCheque(id, 'DEVOLVIDO')
  }

  @Put(':id/status')
  async atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.service.atualizarStatusCheque(id, String(body.status || '').trim())
  }
}
