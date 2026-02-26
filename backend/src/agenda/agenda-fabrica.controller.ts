// Agenda Fábrica: apenas eventos com setor_destino = FABRICA ou PRODUCAO
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { normalizarOrigemFluxo } from './agenda-rules';

const SETOR_FABRICA = 'FABRICA';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('agenda-fabrica')
export class AgendaFabricaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get()
  @Permissoes('agendamentos.ver')
  async findAll(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @Query('status') status?: string,
    @Query('funcionario_id') funcionarioId?: string,
    @Query('incluir_cancelados') incluirCancelados?: string,
    @Query('origem_fluxo') origemFluxoQuery?: string,
  ) {
    return this.agendaService.findAll(inicio, fim, {
      setorDestino: SETOR_FABRICA,
      includePlanoCorte: true,
      status,
      funcionarioId: funcionarioId ? Number(funcionarioId) : undefined,
      origemFluxo: normalizarOrigemFluxo(origemFluxoQuery) || undefined,
      incluirCancelados:
        String(incluirCancelados || '').toLowerCase() === 'true' ||
        incluirCancelados === '1',
    });
  }

  @Post()
  @Permissoes('agendamentos.criar')
  async create(@Body() dto: CreateAgendaDto) {
    return this.agendaService.create({
      ...dto,
      setor_destino: SETOR_FABRICA,
    });
  }

  @Get('funcionario/:id')
  @Permissoes('agendamentos.ver')
  async findByFuncionario(@Param('id') id: string) {
    return this.agendaService.findByFuncionario(+id, SETOR_FABRICA);
  }

  private async garantirSetorFabrica(id: number) {
    const ag = await this.agendaService.findOneFabrica(id);
    if (!ag) {
      throw new ForbiddenException(
        'Este agendamento pertence à agenda da loja e não pode ser alterado aqui.',
      );
    }
  }

  @Patch(':id/status')
  @Permissoes('agendamentos.editar')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('categoria') categoria?: string,
  ) {
    await this.garantirSetorFabrica(+id);
    return this.agendaService.updateStatus(+id, status, categoria);
  }

  @Patch(':id')
  @Permissoes('agendamentos.editar')
  async update(@Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    await this.garantirSetorFabrica(+id);
    return this.agendaService.update(+id, dto);
  }

  @Delete(':id')
  @Permissoes('agendamentos.excluir')
  async remove(@Param('id') id: string) {
    await this.garantirSetorFabrica(+id);
    return this.agendaService.cancel(+id);
  }
}
