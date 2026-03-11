import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ComissaoProducaoService } from './comissao-producao.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('comissao-producao')
export class ComissaoProducaoController {
  constructor(private readonly service: ComissaoProducaoService) {}

  @Get('resumo')
  @Permissoes('comissao_producao.ver')
  getResumo(@Query('mes') mes?: string, @Query('ano') ano?: string) {
    const hoje = new Date();
    const m = mes ? parseInt(mes, 10) : hoje.getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : hoje.getFullYear();
    const mesNum = Number.isFinite(m) && m >= 1 && m <= 12 ? m : hoje.getMonth() + 1;
    const anoNum = Number.isFinite(a) && a >= 2000 && a <= 2100 ? a : hoje.getFullYear();
    return this.service.getResumo(mesNum, anoNum);
  }
}
