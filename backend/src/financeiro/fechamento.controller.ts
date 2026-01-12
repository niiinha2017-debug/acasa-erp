import { Body, Controller, Post } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

@Controller('financeiro/fechamento')
export class FechamentoController {
  constructor(private readonly service: FinanceiroService) {}

  @Post('fornecedor')
  async fecharMesFornecedor(@Body() body: any) {
    return this.service.fecharMesFornecedor(body)
  }
}
