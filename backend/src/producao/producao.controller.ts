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

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  // ✅ NOVO: DETALHE DO PROJETO
  // GET /producao/projetos/:id
  @Get('projetos/:id')
  buscarProjeto(@Param('id') id: string) {
    return this.service.buscarProjeto(this.cleanId(id))
  }

  @Get('agenda')
  agenda(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    return this.service.agenda(inicio, fim)
  }

  @Post('encaminhar')
  encaminhar(@Body() dto: EncaminharProducaoDto) {
    return this.service.encaminhar(dto)
  }

  @Post('tarefas')
  criarTarefa(@Body() dto: CriarTarefaDto) {
    return this.service.criarTarefa(dto)
  }

  @Put('tarefas/:id')
  atualizarTarefa(@Param('id') id: string, @Body() dto: AtualizarTarefaDto) {
    return this.service.atualizarTarefa(this.cleanId(id), dto)
  }

  @Delete('tarefas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerTarefa(@Param('id') id: string) {
    return this.service.removerTarefa(this.cleanId(id))
  }
}
