import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApontamentoProducaoService } from './apontamento-producao.service';
import { CreateApontamentoProducaoDto } from './dto/create-apontamento-producao.dto';
import { UpdateApontamentoProducaoDto } from './dto/update-apontamento-producao.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('apontamento-producao')
export class ApontamentoProducaoController {
  constructor(private readonly service: ApontamentoProducaoService) {}

  @Post()
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  create(@Body() dto: CreateApontamentoProducaoDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  findAll(
    @Req() req: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
    @Query('agenda_fabrica_id') agendaFabricaId?: string,
    @Query('agenda_loja_id') agendaLojaId?: string,
    @Query('tipo_agenda') tipoAgenda?: string,
    @Query('venda_id') vendaId?: string,
    @Query('funcionario_id') funcionarioId?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('categoria') categoria?: string,
  ) {
    const tipo = tipoAgenda === 'venda' || tipoAgenda === 'producao' ? tipoAgenda : undefined;
    return this.service.findAll({
      agenda_fabrica_id: agendaFabricaId ? +agendaFabricaId : undefined,
      agenda_loja_id: agendaLojaId ? +agendaLojaId : undefined,
      tipo_agenda: tipo,
      venda_id: vendaId ? +vendaId : undefined,
      funcionario_id: funcionarioId ? +funcionarioId : undefined,
      data_inicio: dataInicio,
      data_fim: dataFim,
      categoria: categoria || undefined,
      usuario: req?.user,
    });
  }

  /** Lista apontamentos + tarefas pendentes da agenda de venda (para a Timeline). */
  @Get('timeline')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  getTimeline(
    @Req() req: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('tipo_agenda') tipoAgenda?: string,
  ) {
    const tipo = tipoAgenda === 'venda' || tipoAgenda === 'producao' ? tipoAgenda : undefined;
    return this.service.getTimeline({
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo_agenda: tipo,
      usuario: req?.user,
    });
  }

  /** Timeline por tarefas: agendamentos no período com apontamentos aninhados (início/fim de cada funcionário). */
  @Get('timeline/tarefas')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  getTimelinePorTarefas(
    @Req() req: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('tipo_agenda') tipoAgenda?: string,
  ) {
    const tipo = tipoAgenda === 'venda' || tipoAgenda === 'producao' ? tipoAgenda : undefined;
    return this.service.getTimelinePorTarefas({
      data_inicio: dataInicio,
      data_fim: dataFim,
      tipo_agenda: tipo,
      usuario: req?.user,
    });
  }

  @Get('resumo-por-agenda')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  getResumoPorAgenda(@Query('ids') ids: string) {
    const arr = (ids || '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    return this.service.getResumoPorAgenda(arr);
  }

  /** Medições em andamento por cliente (Fluxo de Clientes: responsável + tempo decorrido). */
  @Get('medicao-em-andamento')
  @Permissoes('relatorios.acompanhamento_status.ver', 'agendamentos.producao', 'agendamentos.vendas')
  getMedicaoEmAndamento() {
    return this.service.getMedicaoEmAndamentoPorCliente();
  }

  /** Cronômetros em andamento do funcionário (para badge Iniciar/Pausar/Concluir na agenda). */
  @Get('cronometro/abertos')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  getCronometrosAbertos(@Query('funcionario_id', ParseIntPipe) funcionarioId: number) {
    return this.service.getCronometrosAbertos(funcionarioId);
  }

  @Post('cronometro/iniciar')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  startCronometro(
    @Body()
    body: { agenda_loja_id?: number; agenda_fabrica_id?: number; funcionario_id: number },
  ) {
    return this.service.startCronometro(body);
  }

  @Post('cronometro/:id/pausar')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  pauseCronometro(@Param('id', ParseIntPipe) id: number) {
    return this.service.pauseCronometro(id);
  }

  @Post('cronometro/:id/retomar')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  resumeCronometro(@Param('id', ParseIntPipe) id: number) {
    return this.service.resumeCronometro(id);
  }

  @Post('cronometro/:id/concluir')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  finishCronometro(@Param('id', ParseIntPipe) id: number) {
    return this.service.finishCronometro(id);
  }

  /** Finalizar etapa: encerra cronômetros abertos, marca agenda como CONCLUIDO e avança status do cliente (ex.: Medição → ORÇAMENTO). */
  @Post('finalizar-etapa')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  finalizarEtapa(
    @Body() body: { agenda_loja_id?: number; agenda_fabrica_id?: number },
  ) {
    return this.service.finalizarEtapa(body);
  }

  @Get(':id')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApontamentoProducaoDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissoes('agendamentos.producao', 'agendamentos.vendas')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
