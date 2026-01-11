import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FinanceiroService } from '../financeiro.service';

@Controller('financeiro/contas-pagar')
export class ContasPagarController {
  constructor(private readonly service: FinanceiroService) {}

  // Rota para abrir o modal de acerto de contas
  @Get('saldo-fornecedor/:id')
  obterSaldoFornecedor(@Param('id') id: string) {
    return this.service.calcularSaldoDevedorFornecedor(Number(id));
  }

  // Rota para liquidar a dívida (Gera parcelas/cheques)
  @Post('liquidar-divida')
  liquidar(@Body() dados: any) {
    // Aqui entra a lógica de parcelar em 6x, gerar cheques, etc.
    return this.service.liquidarDividaFornecedor(dados);
  }
}