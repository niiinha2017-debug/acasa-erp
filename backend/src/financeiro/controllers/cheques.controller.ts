import { Controller, Get, Param, Put, Query, ParseIntPipe } from '@nestjs/common';
import { FinanceiroService } from '../financeiro.service';

@Controller('financeiro/cheques')
export class ChequesController {
  constructor(private readonly service: FinanceiroService) {}

  @Get()
  async listar(
    @Query('status') status?: string,
    @Query('banco') banco?: string,
  ) {
    // Retorna a lista de cheques para sua tela de controle
    return this.service.listarCheques({ status, banco });
  }

  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarChequePorId(id);
  }

  @Put(':id/compensar')
  async compensar(@Param('id', ParseIntPipe) id: number) {
    // Rota para quando o cheque cair na conta ("Dar OK")
    return this.service.atualizarStatusCheque(id, 'COMPENSADO');
  }

  @Put(':id/devolver')
  async devolver(@Param('id', ParseIntPipe) id: number) {
    // Rota para caso o cheque volte
    return this.service.atualizarStatusCheque(id, 'DEVOLVIDO');
  }
}