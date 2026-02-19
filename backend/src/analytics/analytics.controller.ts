import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissoes('dashboard.visualizar')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard/resumo')
  getDashboardResumo() {
    return this.service.getDashboardResumo();
  }

  @Get('status-obras')
  getStatusObras() {
    return this.service.getStatusProjetos();
  }

  @Get('dre-despesas')
  getDreDespesas(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.service.getDreDespesas(inicio, fim);
  }
}
