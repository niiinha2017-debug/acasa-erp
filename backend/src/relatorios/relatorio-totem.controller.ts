import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { RelatorioTotemService } from './relatorio-totem.service';

@UseGuards(PermissionsGuard)
@Controller('relatorios/totem-producao')
export class RelatorioTotemController {
  constructor(private readonly service: RelatorioTotemService) {}

  @Get()
  @Permissoes('agendamentos.producao')
  getRelatorio(
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
  ) {
    return this.service.getRelatorio(dataInicio, dataFim);
  }
}
