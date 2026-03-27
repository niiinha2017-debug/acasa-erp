import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DreDetalhadaService } from './dre-detalhada.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('relatorios/dre-detalhada')
export class DreDetalhadaController {
  constructor(private readonly service: DreDetalhadaService) {}

  @Get('clientes')
  @Permissoes('relatorios.dre_detalhada.ver')
  buscarClientes(@Query('q') q?: string) {
    return this.service.buscarClientes(q?.trim() || undefined);
  }

  @Get('ambientes')
  @Permissoes('relatorios.dre_detalhada.ver')
  listarAmbientes(@Query('cliente_id') clienteId?: string) {
    const id = clienteId ? parseInt(clienteId, 10) : 0;
    if (!Number.isFinite(id) || id <= 0) {
      return { projeto: null, ordem_importacao: null, ambientes: [] };
    }
    return this.service.listarAmbientes(id);
  }

  @Get('dre')
  @Permissoes('relatorios.dre_detalhada.ver')
  getDre(
    @Query('projeto_id') projetoId?: string,
    @Query('nome_ambiente') nomeAmbiente?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('fluxo') fluxo?: string,
    @Query('ordem_servico_id') ordemServicoId?: string,
    @Query('producao_etapa_id') producaoEtapaId?: string,
    @Query('garantia_id') garantiaId?: string,
  ) {
    const hoje = new Date();
    const m = mes ? parseInt(mes, 10) : hoje.getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : hoje.getFullYear();
    const mesNum = Number.isFinite(m) && m >= 1 && m <= 12 ? m : hoje.getMonth() + 1;
    const anoNum = Number.isFinite(a) && a >= 2000 && a <= 2100 ? a : hoje.getFullYear();

    const f = String(fluxo || '').toLowerCase();
    if (f === 'importacao') {
      const osid = ordemServicoId ? parseInt(ordemServicoId, 10) : 0;
      const peid = producaoEtapaId != null ? parseInt(producaoEtapaId, 10) : 0;
      if (!Number.isFinite(osid) || osid <= 0) {
        return null;
      }
      return this.service.getDreImportacaoEtapa(osid, peid, mesNum, anoNum);
    }

    if (f === 'garantia') {
      const gid = garantiaId ? parseInt(garantiaId, 10) : 0;
      if (!Number.isFinite(gid) || gid <= 0) {
        return null;
      }
      return this.service.getDreGarantia(gid, mesNum, anoNum);
    }

    const pid = projetoId ? parseInt(projetoId, 10) : 0;
    const nome = nomeAmbiente?.trim();
    if (!Number.isFinite(pid) || pid <= 0 || !nome) {
      return null;
    }
    return this.service.getDreAmbiente(pid, nome, mesNum, anoNum);
  }

  @Get('dashboard-projeto')
  @Permissoes('relatorios.dre_detalhada.ver')
  getDashboardProjeto(@Query('projeto_id') projetoId?: string) {
    const id = projetoId ? parseInt(projetoId, 10) : 0;
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }
    return this.service.getDashboardConsumoProjeto(id);
  }

  @Get('resumo-prazos')
  @Permissoes('relatorios.dre_detalhada.ver')
  getResumoPrazos(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const hoje = new Date();
    const m = mes ? parseInt(mes, 10) : hoje.getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : hoje.getFullYear();
    const mesNum = Number.isFinite(m) && m >= 1 && m <= 12 ? m : hoje.getMonth() + 1;
    const anoNum = Number.isFinite(a) && a >= 2000 && a <= 2100 ? a : hoje.getFullYear();
    return this.service.getResumoPrazosMes(mesNum, anoNum);
  }

  @Get('graficos-validacao')
  @Permissoes('relatorios.dre_detalhada.ver', 'dashboard.visualizar')
  getGraficosValidacao(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('meta') meta?: string,
  ) {
    const hoje = new Date();
    const m = mes ? parseInt(mes, 10) : hoje.getMonth() + 1;
    const a = ano ? parseInt(ano, 10) : hoje.getFullYear();
    const mesNum = Number.isFinite(m) && m >= 1 && m <= 12 ? m : hoje.getMonth() + 1;
    const anoNum = Number.isFinite(a) && a >= 2000 && a <= 2100 ? a : hoje.getFullYear();
    const metaNum = meta != null && meta !== '' ? parseFloat(meta) : undefined;
    return this.service.getGraficosValidacao(mesNum, anoNum, Number.isFinite(metaNum) ? metaNum : undefined);
  }
}
