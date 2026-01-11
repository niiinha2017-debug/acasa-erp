import { Controller, Get } from '@nestjs/common';
import { FinanceiroService } from '../financeiro.service';

@Controller('financeiro/contas-receber')
export class ContasReceberController {
  constructor(private readonly service: FinanceiroService) {}

  @Get()
  index() {
    return { message: 'Módulo de Contas a Receber ativo' };
  }
}