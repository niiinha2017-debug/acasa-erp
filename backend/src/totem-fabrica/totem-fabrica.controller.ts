import { Body, Controller, Get, Post, Param, Query, Req, UseGuards, ParseIntPipe, Delete } from '@nestjs/common';
import { ApontamentoProducaoService, SobraTotemDto } from '../apontamento-producao/apontamento-producao.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('totem-fabrica')
export class TotemFabricaController {
  constructor(private readonly apontamentoService: ApontamentoProducaoService) {}

  /** Pré-medição por cliente: retorna rascunho atual ou cria um novo automaticamente. */
  @Get('pre-medicao/cliente/:clienteId')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  getOuCriarPreMedicao(@Param('clienteId', ParseIntPipe) clienteId: number) {
    return this.apontamentoService.getOuCriarPreMedicaoByCliente(clienteId);
  }

  /** Retorna um rascunho de pré-medição existente pelo id. */
  @Get('pre-medicao/:preMedicaoId')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  getPreMedicaoById(@Param('preMedicaoId', ParseIntPipe) preMedicaoId: number) {
    return this.apontamentoService.getPreMedicaoById(preMedicaoId);
  }

  /** Salva/atualiza ambiente no rascunho da pré-medição (por nome). */
  @Post('pre-medicao/:preMedicaoId/ambiente')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  salvarAmbientePreMedicao(
    @Param('preMedicaoId', ParseIntPipe) preMedicaoId: number,
    @Body()
    body: {
      nome_ambiente: string;
      largura_m?: number;
      pe_direito_m?: number;
      profundidade_m?: number;
      observacoes?: string;
      medidas_json?: string;
    },
  ) {
    return this.apontamentoService.salvarAmbientePreMedicao(preMedicaoId, body);
  }

  /** Remove um ambiente do rascunho da pré-medição. */
  @Delete('pre-medicao/:preMedicaoId/ambiente/:ambienteId')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  removerAmbientePreMedicao(
    @Param('preMedicaoId', ParseIntPipe) preMedicaoId: number,
    @Param('ambienteId', ParseIntPipe) ambienteId: number,
  ) {
    return this.apontamentoService.removerAmbientePreMedicao(preMedicaoId, ambienteId);
  }

  /**
   * Vincula pré-medição ao agendamento técnico e importa os ambientes para medicao_orcamento.
   * A partir desse momento, a medição por ambiente pode seguir no fluxo normal.
   */
  @Post('pre-medicao/:preMedicaoId/vincular-agendamento/:agendaLojaId')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  vincularPreMedicaoAoAgendamento(
    @Param('preMedicaoId', ParseIntPipe) preMedicaoId: number,
    @Param('agendaLojaId', ParseIntPipe) agendaLojaId: number,
  ) {
    return this.apontamentoService.vincularPreMedicaoAoAgendamento(preMedicaoId, agendaLojaId);
  }

  /** Venda Direta: cria agenda técnica automática e permite gerar orçamento técnico sem depender de agendamento manual. */
  @Post('pre-medicao/:preMedicaoId/digitar-medidas-agora')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  iniciarVendaDiretaComPreMedicao(
    @Param('preMedicaoId', ParseIntPipe) preMedicaoId: number,
    @Req() req: { user?: { id?: number } },
  ) {
    const userId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.apontamentoService.iniciarVendaDiretaComPreMedicao(preMedicaoId, userId);
  }

  /** Visita Técnica: cria agendamento e envia a medição para preenchimento via Totem em campo. */
  @Post('pre-medicao/:preMedicaoId/solicitar-medicao-tecnica')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  solicitarMedicaoTecnicaComPreMedicao(
    @Param('preMedicaoId', ParseIntPipe) preMedicaoId: number,
    @Req() req: { user?: { id?: number } },
  ) {
    const userId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.apontamentoService.solicitarMedicaoTecnicaComPreMedicao(preMedicaoId, userId);
  }

  /**
   * Salva uma parede (lado) de um ambiente. Body: { parede_id?, nome, largura_m?, pe_direito_m?, profundidade_m?, observacoes?, medidas? }.
   * Declarada antes das rotas :id para não ser capturada por elas.
   */
  @Post('ambiente/:ambienteId/parede')
  @Permissoes('agendamentos.producao')
  salvarParedeMedicao(
    @Param('ambienteId', ParseIntPipe) ambienteId: number,
    @Body()
    body: {
      parede_id?: number;
      nome: string;
      agenda_loja_id?: number;
      nome_ambiente?: string;
      largura_m?: number;
      pe_direito_m?: number;
      profundidade_m?: number;
      observacoes?: string;
      medidas?: Array<{ descricao: string; valor_mm: number }>;
    },
  ) {
    return this.apontamentoService.salvarParedeMedicao(ambienteId, body);
  }

  /** Remove uma parede de um ambiente da medição (pré-orçamento). */
  @Delete('ambiente/:ambienteId/parede/:paredeId')
  @Permissoes('agendamentos.producao')
  removerParedeMedicao(
    @Param('ambienteId', ParseIntPipe) ambienteId: number,
    @Param('paredeId', ParseIntPipe) paredeId: number,
  ) {
    return this.apontamentoService.removerParedeMedicao(ambienteId, paredeId);
  }

  /** Remove um ambiente inteiro da medição (pré-orçamento). */
  @Delete(':id/ambiente/:ambienteId')
  @Permissoes('agendamentos.producao')
  removerAmbienteMedicao(
    @Param('id', ParseIntPipe) agendaLojaId: number,
    @Param('ambienteId', ParseIntPipe) ambienteId: number,
  ) {
    return this.apontamentoService.removerAmbienteMedicao(agendaLojaId, ambienteId);
  }

  /**
   * Retorna uma única tarefa do totem por id (para páginas dedicadas de medição).
   * Query: tipo = 'agenda_loja' | 'agenda_fabrica'
   */
  @Get('tarefa/:id')
  @Permissoes('agendamentos.producao')
  getTarefa(
    @Param('id', ParseIntPipe) id: number,
    @Query('tipo') tipo: 'agenda_loja' | 'agenda_fabrica' = 'agenda_fabrica',
  ) {
    return this.apontamentoService.getTotemTarefaById(id, tipo);
  }

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
   * Medições fina sem projeto vinculado: lista projetos do cliente da tarefa (para escolher no totem).
   */
  @Get(':id/projetos-medicao-fina')
  @Permissoes('agendamentos.producao')
  listarProjetosMedicaoFinaTotem(@Param('id', ParseIntPipe) agendaFabricaId: number) {
    return this.apontamentoService.listarProjetosClienteParaTotemMedicaoFina(agendaFabricaId);
  }

  /**
   * Vincula um projeto à tarefa de medição fina (agenda_fabrica).
   */
  @Post(':id/vincular-projeto')
  @Permissoes('agendamentos.producao')
  vincularProjetoMedicaoFinaTotem(
    @Param('id', ParseIntPipe) agendaFabricaId: number,
    @Body() body: { projeto_id: number },
    @Req() req: { user?: { id?: number } },
  ) {
    const uid = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.apontamentoService.vincularProjetoTotemMedicaoFina(
      agendaFabricaId,
      Number(body?.projeto_id),
      uid,
    );
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

  /**
   * Retorna a medição para orçamento (com ambientes) do agendamento, para a página de medição por ambiente.
   */
  @Get(':id/medicao-orcamento')
  @Permissoes('agendamentos.producao')
  getMedicaoOrcamento(@Param('id', ParseIntPipe) id: number) {
    return this.apontamentoService.getMedicaoOrcamentoByAgenda(id);
  }

  /**
   * Salva um único ambiente da medição (Cozinha, Sala, etc.). Não finaliza a tarefa.
   * Body: { nome_ambiente, largura_m?, pe_direito_m?, profundidade_m?, observacoes?, medidas?: [{ descricao, valor_mm }] }.
   */
  @Post(':id/salvar-ambiente-medicao')
  @Permissoes('agendamentos.producao')
  salvarAmbienteMedicao(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      nome_ambiente: string;
      largura_m?: number;
      pe_direito_m?: number;
      profundidade_m?: number;
      observacoes?: string;
      medidas?: Array<{ descricao: string; valor_mm: number }>;
    },
  ) {
    return this.apontamentoService.salvarAmbienteMedicao(id, body);
  }

  /**
   * Concluir Medição para Orçamento: salva ambientes com suas paredes e finaliza.
   * ambientes[].paredes = array de paredes a persistir na MedicaoParede.
   */
  @Post(':id/concluir-medicao-orcamento')
  @Permissoes('agendamentos.producao')
  concluirMedicaoOrcamento(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      medidas_gerais?: string;
      observacoes?: string;
      ambientes?: Array<{
        id?: number;
        nome_ambiente: string;
        largura_m?: number;
        pe_direito_m?: number;
        profundidade_m?: number;
        observacoes?: string;
        medidas?: Array<{ descricao: string; valor_mm: number }>;
        paredes?: Array<{
          nome: string;
          largura_m?: number;
          pe_direito_m?: number;
          profundidade_m?: number;
          observacoes?: string;
          medidas?: Array<{ descricao: string; valor_mm: number }>;
        }>;
      }>;
      medidas?: Array<{ descricao: string; valor_mm: number }>;
    },
  ) {
    return this.apontamentoService.concluirMedicaoOrcamento(
      id,
      body?.medidas_gerais ?? '',
      body?.observacoes ?? '',
      body?.ambientes,
      body?.medidas,
    );
  }
}
