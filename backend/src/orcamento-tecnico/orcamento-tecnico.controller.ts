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
  @Permissoes('agendamentos.vendas')
  listar(@Query('agenda_loja_id') agendaLojaId?: string) {
    const id = agendaLojaId ? Number(agendaLojaId) : undefined;
    return this.orcamentoTecnicoService.listar(id);
  }

  /**
   * Busca um orçamento técnico por id (com itens e dados do agendamento).
   */
  @Get(':id')
  @Permissoes('agendamentos.vendas')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.orcamentoTecnicoService.buscarPorId(id);
  }

  /**
   * Cria orçamento técnico a partir da medição do agendamento, com os ambientes selecionados.
   * Body: { agenda_loja_id, ambiente_ids: number[] } — ids de medicao_orcamento_ambiente.
   */
  @Post('novo')
  @Permissoes('agendamentos.vendas')
  criarNovo(@Body() body: { agenda_loja_id: number; ambiente_ids: number[] }) {
    const agendaLojaId = Number(body?.agenda_loja_id);
    const ambienteIds = Array.isArray(body?.ambiente_ids) ? body.ambiente_ids.map(Number).filter((id) => id > 0) : [];
    return this.orcamentoTecnicoService.criarDeMedicao(agendaLojaId, ambienteIds);
  }

  /**
   * Gera PDF de Proposta Técnica (apenas dados públicos — sem custos internos).
   */
  @Post(':id/pdf-proposta')
  @Permissoes('agendamentos.vendas')
  gerarPdfPropostaTecnica(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      preco_venda?: number;
      validade?: string;
      valor_entrada?: number;
      quantidade_parcelas?: number;
      observacoes_pagamento?: string;
      prazo_entrega_dias_uteis?: number;
    },
  ) {
    return this.orcamentoTecnicoService.gerarPdfPropostaCliente(id, {
      preco_venda: Number(body?.preco_venda || 0),
      validade: String(body?.validade || '').trim(),
      valor_entrada: Number(body?.valor_entrada || 0),
      quantidade_parcelas: Number(body?.quantidade_parcelas || 1),
      observacoes_pagamento: String(body?.observacoes_pagamento || '').trim(),
      prazo_entrega_dias_uteis: Number(body?.prazo_entrega_dias_uteis || 0),
    });
  }
}
