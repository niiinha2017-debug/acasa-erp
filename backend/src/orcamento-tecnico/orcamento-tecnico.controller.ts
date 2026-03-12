import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { OrcamentoTecnicoService } from './orcamento-tecnico.service';

@UseGuards(PermissionsGuard)
@Controller('orcamento-tecnico')
export class OrcamentoTecnicoController {
  constructor(private readonly orcamentoTecnicoService: OrcamentoTecnicoService) {}

  /**
   * Lista orçamentos técnicos. Query opcional: agenda_loja_id.
   */
  @Get('lista')
  @Permissoes('agendamentos.producao')
  listar(@Query('agenda_loja_id') agendaLojaId?: string) {
    const id = agendaLojaId ? Number(agendaLojaId) : undefined;
    return this.orcamentoTecnicoService.listar(id);
  }

  /**
   * Busca um orçamento técnico por id (com itens e dados do agendamento).
   */
  @Get(':id')
  @Permissoes('agendamentos.producao')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.orcamentoTecnicoService.buscarPorId(id);
  }

  /**
   * Cria orçamento técnico a partir da medição do agendamento, com os ambientes selecionados.
   * Body: { agenda_loja_id, ambiente_ids: number[] } — ids de medicao_orcamento_ambiente.
   */
  @Post('novo')
  @Permissoes('agendamentos.producao')
  criarNovo(@Body() body: { agenda_loja_id: number; ambiente_ids: number[] }) {
    const agendaLojaId = Number(body?.agenda_loja_id);
    const ambienteIds = Array.isArray(body?.ambiente_ids) ? body.ambiente_ids.map(Number).filter((id) => id > 0) : [];
    return this.orcamentoTecnicoService.criarDeMedicao(agendaLojaId, ambienteIds);
  }
}
