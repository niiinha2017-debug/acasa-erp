import { 
  Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus 
} from '@nestjs/common'
import { ProducaoService } from './producao.service'
import { CriarTarefaDto } from './dto/criar-tarefa.dto'
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'

@Controller('producao')
export class ProducaoController {
  constructor(private readonly service: ProducaoService) {}

  /**
   * Função de limpeza de IDs para evitar erros de tipagem e ataques de injeção
   */
  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  /**
   * Agenda de Produção (projetos) no intervalo
   * GET /producao/agenda?inicio=ISO&fim=ISO
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

  // ======================
  // 1. CRUD DE TAREFAS
  // ======================

  @Post('tarefas')
  criarTarefa(@Body() dto: CriarTarefaDto) {
    return this.service.criarTarefa(dto)
  }

  @Put('tarefas/:id') // Padronizado para Put
  atualizarTarefa(@Param('id') id: string, @Body() dto: AtualizarTarefaDto) {
    return this.service.atualizarTarefa(this.cleanId(id), dto)
  }

  @Delete('tarefas/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorno 204 para remoção limpa
  removerTarefa(@Param('id') id: string) {
    return this.service.removerTarefa(this.cleanId(id))
  }
}