import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { ProducaoService } from './producao.service'
import { CriarTarefaDto } from './dto/criar-tarefa.dto'
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('producao')
export class ProducaoController {
  constructor(private readonly service: ProducaoService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''))
  }

  // GET /producao/projetos/:id
  @Get('projetos/:id')
  @Permissoes('producao.ver')
  buscarProjeto(@Param('id') id: string) {
    return this.service.buscarProjeto(this.cleanId(id))
  }

  @Get('agenda')
  @Permissoes('producao.ver')
  agenda(@Query('inicio') inicio: string, @Query('fim') fim: string) {
    return this.service.agenda(inicio, fim)
  }

  @Post('encaminhar')
  @Permissoes('producao.criar')
  encaminhar(@Body() dto: EncaminharProducaoDto) {
    return this.service.encaminhar(dto)
  }

  @Post('tarefas')
  @Permissoes('producao.criar')
  criarTarefa(@Body() dto: CriarTarefaDto) {
    return this.service.criarTarefa(dto)
  }

  @Put('tarefas/:id')
  @Permissoes('producao.editar')
  atualizarTarefa(@Param('id') id: string, @Body() dto: AtualizarTarefaDto) {
    return this.service.atualizarTarefa(this.cleanId(id), dto)
  }

  @Delete('tarefas/:id')
  @Permissoes('producao.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerTarefa(@Param('id') id: string) {
    return this.service.removerTarefa(this.cleanId(id))
  }
}
