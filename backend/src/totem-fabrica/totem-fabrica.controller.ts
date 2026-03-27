import { Body, Controller, Get, Post, Param, Query, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApontamentoProducaoService, SobraTotemDto } from '../apontamento-producao/apontamento-producao.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('totem-fabrica')
export class TotemFabricaController {
  constructor(private readonly apontamentoService: ApontamentoProducaoService) {}

  /**
   * Lista tarefas para o totem: apenas status Pendente ou Em Produção, mesma ordem da Agenda (inicio_em asc).
   */
  @Get('tarefas')
  @Permissoes('agendamentos.producao')
  getTarefas(
    @Req() req: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
  ) {
    return this.apontamentoService.getTotemTarefas({
      data_inicio: dataInicio,
      data_fim: dataFim,
      usuario: req?.user,
    });
  }

  /**
   * Consumos (produtos) do plano de corte da tarefa — para o marceneiro escolher o material ao registrar sobra.
   */
  @Get(':id/consumos')
  @Permissoes('agendamentos.producao')
  getConsumos(@Param('id', ParseIntPipe) id: number) {
    return this.apontamentoService.getConsumosTotem(id);
  }

  /**
   * Play: define status Em Produção e grava horário de início (apontamentos para a equipe).
   * Body opcional: { tipo: 'agenda_fabrica' | 'agenda_loja' } — default agenda_fabrica. Use 'agenda_loja' para medição externa.
   */
  @Post(':id/play')
  @Permissoes('agendamentos.producao')
  play(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user?: { id?: number } },
    @Body() body: { tipo?: 'agenda_fabrica' | 'agenda_loja' },
  ) {
    const userId = req?.user?.id != null ? Number(req.user.id) : undefined;
    const tipo = body?.tipo === 'agenda_loja' ? 'agenda_loja' : 'agenda_fabrica';
    return this.apontamentoService.totemPlay(id, userId, tipo);
  }

  /**
   * Check: define como Concluído, grava horário fim e calcula custo (tempo × custo/hora da equipe) para DRE.
   * Body opcional: { tipo?: 'agenda_fabrica'|'agenda_loja', sobras?: [{ produto_id, largura_mm, comprimento_mm }] }.
   * tipo 'agenda_loja' = medição externa (apenas finaliza; sobras não se aplicam).
   */
  @Post(':id/check')
  @Permissoes('agendamentos.producao')
  check(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { tipo?: 'agenda_fabrica' | 'agenda_loja'; sobras?: SobraTotemDto[] },
  ) {
    const tipo = body?.tipo === 'agenda_loja' ? 'agenda_loja' : 'agenda_fabrica';
    return this.apontamentoService.totemCheck(id, body?.sobras, tipo);
  }

}
