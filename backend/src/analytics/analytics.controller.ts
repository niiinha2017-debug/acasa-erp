import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard/resumo')
  @Permissoes('dashboard.visualizar')
  getDashboardResumo() {
    return this.service.getDashboardResumo();
  }

  /** Visão geral Vendas (Comercial) – orçamentos, vendas do mês, contratos. */
  @Get('dashboard/resumo-vendas')
  @Permissoes('orcamentos.ver', 'vendas.criar', 'contratos.ver')
  getResumoVendas() {
    return this.service.getResumoVendas();
  }

  /** Visão geral Produção – vendas em produção, finalizadas, plano de corte. */
  @Get('dashboard/resumo-producao')
  @Permissoes('vendas.ver', 'plano_corte.ver')
  getResumoProducao() {
    return this.service.getResumoProducao();
  }

  @Get('status-obras')
  @Permissoes('dashboard.visualizar')
  getStatusObras() {
    return this.service.getStatusProjetos();
  }

  @Get('dre-despesas')
  @Permissoes('dashboard.visualizar')
  getDreDespesas(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.service.getDreDespesas(inicio, fim);
  }
}
