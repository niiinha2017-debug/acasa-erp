import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { FinanceiroService } from './financeiro.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financeiro/fechamento')
export class FechamentoController {
  constructor(private readonly service: FinanceiroService) {}

  @Post('fornecedor')
  @Permissoes('fechamento_fornecedor.criar')
  async fecharMesFornecedor(@Body() body: any) {
    return this.service.fecharMesFornecedor(body)
  }
}
