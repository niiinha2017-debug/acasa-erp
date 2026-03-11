import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { CustosEstruturaService } from './custos-estrutura.service';
import { UpsertCustosEstruturaDto } from './dto/upsert-custos-estrutura.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('financeiro/custos-estrutura')
export class CustosEstruturaController {
  constructor(private readonly service: CustosEstruturaService) {}

  /** Resumo para cards. Parâmetros unificados: periodo=mes|ano, mes (opcional), ano. Em erro retorna objeto zerado. */
  @Get('resumo')
  @Permissoes('custos_estrutura.ver')
  async getResumo(
    @Query('periodo') periodo?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const hoje = new Date();
    const porAno = String(periodo || 'mes').toLowerCase() === 'ano';
    const mesNum = mes ? parseInt(mes, 10) : undefined;
    const anoNum = ano ? parseInt(ano, 10) : undefined;
    const m = Number.isFinite(mesNum) && mesNum >= 1 && mesNum <= 12 ? mesNum : hoje.getMonth() + 1;
    const a = Number.isFinite(anoNum) && anoNum >= 2000 ? anoNum : hoje.getFullYear();
    const fallback = {
      mes: porAno ? null : m,
      ano: a,
      custo_ocupacao: 0,
      custo_operacional: 0,
      custo_manutencao_depreciacao: 0,
      total_custos_estrutura: 0,
      horas_uteis_mes: porAno ? 12 * 176 : 176,
      custo_hora_estrutura: 0,
      total_compras_mes: 0,
      custo_fabrica: 0,
      custo_hora: 0,
      projecao_total: 0,
      origem_custo_fabrica: 'despesas',
      periodo: porAno ? 'ano' : 'mes',
    };
    try {
      if (porAno) return await this.service.getResumoAnual(a);
      return await this.service.getResumo(m, a);
    } catch (err) {
      console.error('[CustosEstrutura] getResumo falhou, retornando resumo zerado:', (err as Error)?.message ?? err);
      return fallback;
    }
  }

  /** Parâmetros: horas úteis vêm do cadastro da Empresa (horas_uteis_mes_fabrica); fallback 176. */
  @Get('constantes')
  @Permissoes('custos_estrutura.ver')
  getConstantes() {
    return this.service.getConstantes();
  }

  /** Dados para gráfico de evolução (últimos N meses: total custos e custo/hora). */
  @Get('grafico')
  @Permissoes('custos_estrutura.ver')
  getGrafico(@Query('ultimos_meses') ultimosMeses?: string) {
    const n = ultimosMeses ? parseInt(ultimosMeses, 10) : 12;
    return this.service.getGraficoEvolucao(Number.isFinite(n) && n >= 1 && n <= 24 ? n : 12);
  }

  /** Busca registro por mês/ano (para preencher o formulário). */
  @Get()
  @Permissoes('custos_estrutura.ver')
  getByMesAno(@Query('mes') mes: string, @Query('ano') ano: string) {
    const mesNum = mes ? parseInt(mes, 10) : new Date().getMonth() + 1;
    const anoNum = ano ? parseInt(ano, 10) : new Date().getFullYear();
    if (!Number.isFinite(mesNum) || mesNum < 1 || mesNum > 12 || !Number.isFinite(anoNum)) {
      return null;
    }
    return this.service.getByMesAno(mesNum, anoNum);
  }

  /** Totais do mês/ano a partir do módulo Despesas (categorias de custo fixo). Para preencher formulário e aviso de sincronização. */
  @Get('from-despesas')
  @Permissoes('custos_estrutura.ver')
  async getFromDespesas(@Query('mes') mes: string, @Query('ano') ano: string) {
    const mesNum = mes ? parseInt(mes, 10) : new Date().getMonth() + 1;
    const anoNum = ano ? parseInt(ano, 10) : new Date().getFullYear();
    if (!Number.isFinite(mesNum) || mesNum < 1 || mesNum > 12 || !Number.isFinite(anoNum)) {
      return { custo_ocupacao: 0, custo_operacional: 0, custo_manutencao_depreciacao: 0, total_custos: 0, horas_uteis_mes: 0, custo_hora_estrutura: 0 };
    }
    const totais = await this.service.getTotaisFromDespesas(mesNum, anoNum);
    const horasUteis = await this.service.getHorasUteisMes(mesNum, anoNum);
    const custoHora = horasUteis > 0 ? totais.total_custos / horasUteis : 0;
    return {
      ...totais,
      horas_uteis_mes: horasUteis,
      custo_hora_estrutura: Math.round((custoHora + Number.EPSILON) * 10000) / 10000,
    };
  }

  /** Cria ou atualiza custos de estrutura do mês e recalcula Custo_Hora_Estrutura. */
  @Put()
  @Permissoes('custos_estrutura.editar')
  upsert(@Body() dto: UpsertCustosEstruturaDto) {
    return this.service.upsert(dto);
  }
}
