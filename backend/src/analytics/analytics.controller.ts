import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { PontoRelatorioService } from '../ponto/relatorio/ponto-relatorio.service';
import { AnalyticsService } from './analytics.service';
import { FeriadosService } from './feriados.service';
import { QuickChartService } from './quickchart.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(
    private readonly service: AnalyticsService,
    private readonly quickchart: QuickChartService,
    private readonly pontoRelatorio: PontoRelatorioService,
    private readonly feriados: FeriadosService,
  ) {}

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
  @Permissoes('posvenda.ver', 'plano_corte.ver')
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

  /** DRE mensal: receita (vendas), despesas por categoria e resultado do mês. */
  @Get('dre-mensal')
  @Permissoes('dashboard.visualizar')
  getDreMensal(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const m = mes ? parseInt(mes, 10) : new Date().getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : new Date().getFullYear();
    if (!m || m < 1 || m > 12 || !a) {
      return { erro: 'mes (1-12) e ano obrigatórios' };
    }
    return this.service.getDreMensal(m, a);
  }

  /** Feriados nacionais (Brasil API, grátis). ano opcional (padrão: ano atual). */
  @Get('feriados')
  @Permissoes('dashboard.visualizar')
  async getFeriados(@Query('ano') ano?: string) {
    const a = ano ? parseInt(ano, 10) : new Date().getFullYear();
    if (!a) return [];
    return this.feriados.getFeriadosPorAno(a);
  }

  /** Feriados de um mês específico. */
  @Get('feriados/mes')
  @Permissoes('dashboard.visualizar')
  async getFeriadosMes(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const m = mes ? parseInt(mes, 10) : new Date().getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : new Date().getFullYear();
    if (!m || m < 1 || m > 12 || !a) return [];
    return this.feriados.getFeriadosPorMes(a, m);
  }

  /**
   * URL de gráfico (QuickChart) para relatórios, e-mail, PDF ou n8n.
   * type: dre-despesas | horas-trabalhadas | status-obras
   * Para horas-trabalhadas use data_ini e data_fim (YYYY-MM-DD).
   * width/height opcionais (padrão 900x450).
   */
  @Get('chart-url')
  @Permissoes('dashboard.visualizar')
  async getChartUrl(
    @Query('type') type: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
  ) {
    const opts = {
      width: width ? parseInt(width, 10) : 900,
      height: height ? parseInt(height, 10) : 450,
    };
    const t = (type || '').toLowerCase();

    if (t === 'dre-despesas') {
      const data = await this.service.getDreDespesas(inicio, fim);
      const url = this.quickchart.buildDreDespesasUrl(data, opts);
      return { url };
    }

    if (t === 'horas-trabalhadas') {
      const di = data_ini || inicio;
      const df = data_fim || fim;
      if (!di || !df) {
        return { erro: 'data_ini e data_fim (ou inicio e fim) obrigatórios para horas-trabalhadas' };
      }
      const { linhas } = await this.pontoRelatorio.fechamentoFolha({
        data_ini: di,
        data_fim: df,
        apenas_ativos: true,
      });
      const url = this.quickchart.buildHorasTrabalhadasUrl(
        linhas.map((l) => ({ nome: l.nome, horas_trabalhadas: l.horas_trabalhadas })),
        opts,
      );
      return { url };
    }

    if (t === 'status-obras') {
      const data = await this.service.getStatusProjetos();
      const url = this.quickchart.buildStatusObrasUrl(data, opts);
      return { url };
    }

    return { erro: 'type deve ser: dre-despesas | horas-trabalhadas | status-obras' };
  }
}
