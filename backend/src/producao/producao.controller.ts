import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common'
import { ProducaoService } from './producao.service'
import { CriarTarefaDto } from './dto/criar-tarefa.dto'
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'

@Controller('producao')
export class ProducaoController {
  constructor(private readonly service: ProducaoService) {}

  /**
   * Agenda de Produção (projetos) no intervalo
   * /producao/agenda?inicio=ISO&fim=ISO
   */
  @Get('agenda')
  agenda(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    return this.service.agenda(inicio, fim)
  }

  /**
   * Encaminhar origem para Produção (Venda/Plano de Corte)
   * Cria/garante producao_projetos e marca encaminhado_em + status
   */
  @Post('encaminhar')
  encaminhar(@Body() dto: EncaminharProducaoDto) {
    return this.service.encaminhar(dto)
  }

  /** CRUD tarefas */
  @Post('tarefas')
  criarTarefa(@Body() dto: CriarTarefaDto) {
    return this.service.criarTarefa(dto)
  }

  @Patch('tarefas/:id')
  atualizarTarefa(@Param('id') id: string, @Body() dto: AtualizarTarefaDto) {
    return this.service.atualizarTarefa(Number(id), dto)
  }

  @Delete('tarefas/:id')
  removerTarefa(@Param('id') id: string) {
    return this.service.removerTarefa(Number(id))
  }
}
