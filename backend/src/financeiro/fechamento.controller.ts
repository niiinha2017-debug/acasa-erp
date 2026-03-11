import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { FecharMesFornecedorDto } from './dto/fechar-mes-fornecedor.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('financeiro/fechamento')
export class FechamentoController {
  constructor(private readonly service: FinanceiroService) {}

  @Post('fornecedor')
  @Permissoes('fechamento_fornecedor.criar')
  @HttpCode(HttpStatus.OK)
  async fecharMesFornecedor(@Body() body: FecharMesFornecedorDto) {
    return this.service.fecharMesFornecedor(body);
  }
}
