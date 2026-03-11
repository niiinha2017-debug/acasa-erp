import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('relatorios/dre-mensal')
export class DreController {
  constructor(private readonly financeiro: FinanceiroService) {}

  @Get()
  @Permissoes('relatorios.dre_mensal.ver')
  getDre(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const hoje = new Date();
    const mesNum = mes ? parseInt(mes, 10) : hoje.getMonth() + 1;
    const anoNum = ano ? parseInt(ano, 10) : hoje.getFullYear();
    const m = Number.isFinite(mesNum) && mesNum >= 1 && mesNum <= 12 ? mesNum : hoje.getMonth() + 1;
    const a = Number.isFinite(anoNum) && anoNum >= 2000 && anoNum <= 2100 ? anoNum : hoje.getFullYear();
    return this.financeiro.getDreMensal(m, a);
  }
}
