// Agenda Fábrica: apenas eventos com setor_destino = FABRICA ou PRODUCAO
// Regra (igual à agenda da venda): responsável = quem criou a tarefa; só o criador ou Admin pode alterar.
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
  Req,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { normalizarOrigemFluxo } from './agenda-rules';

const SETOR_FABRICA = 'FABRICA';

@UseGuards(PermissionsGuard)
@Controller('agenda-fabrica')
export class AgendaFabricaController {
  constructor(private readonly agendaService: AgendaService) {}

  /**
   * Regra (mesma da agenda da venda): só o criador da tarefa ou Admin pode alterar/excluir.
   */
  private async podeEditarAgendaFabrica(
    id: number,
    req: any,
  ): Promise<{ pode: boolean; registrarAlteradoPor: boolean }> {
    const user = req?.user;
    if (!user) return { pode: false, registrarAlteradoPor: false };
    const isAdmin = user.is_admin === true;
    if (isAdmin) return { pode: true, registrarAlteradoPor: true };
    const agenda = await this.agendaService.findOneFabricaParaPermissao(id);
    if (!agenda) return { pode: false, registrarAlteradoPor: false };
    const criadoPorUserId =
      agenda.criado_por_usuario_id != null
        ? Number(agenda.criado_por_usuario_id)
        : null;
    const userId = user.id != null ? Number(user.id) : null;
    const foiCriadoPorMim = userId != null && criadoPorUserId === userId;
    return { pode: foiCriadoPorMim, registrarAlteradoPor: false };
  }

  @Get('pendentes-medida-fina')
  @Permissoes('agendamentos.ver')
  async pendentesMedidaFina() {
    return this.agendaService.findPendentesMedidaFina();
  }

  @Get('montagem-concluida')
  @Permissoes('agendamentos.ver')
  async montagemConcluida() {
    return this.agendaService.findMontagemConcluida();
  }

  @Get()
  @Permissoes('agendamentos.ver')
  async findAll(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @Query('status') status?: string,
    @Query('funcionario_id') funcionarioId?: string,
    @Query('incluir_cancelados') incluirCancelados?: string,
    @Query('origem_fluxo') origemFluxoQuery?: string,
    @Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
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
      usuario: req?.user,
    });
  }

  @Post()
  @Permissoes('agendamentos.criar')
  async create(@Body() dto: CreateAgendaDto, @Req() req?: any) {
    const criadoPorUsuarioId = req?.user?.id != null ? Number(req.user.id) : undefined;
    return this.agendaService.create(
      { ...dto, setor_destino: SETOR_FABRICA },
      criadoPorUsuarioId ? { criadoPorUsuarioId } : undefined,
    );
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
    @Body('subetapa') subetapa?: string,
    @Body('alterado_em') alteradoEm?: string,
    @Body('data_conclusao') dataConclusao?: string,
    @Req() req?: any,
  ) {
    await this.garantirSetorFabrica(+id);
    const { pode, registrarAlteradoPor } = await this.podeEditarAgendaFabrica(
      +id,
      req,
    );
    if (!pode) {
      throw new ForbiddenException(
        'Só o responsável pela tarefa ou um administrador pode alterar.',
      );
    }
    return this.agendaService.updateStatus(+id, status, {
      setorDestino: SETOR_FABRICA,
      alteradoEm,
      dataConclusao,
      subetapa,
      ...(registrarAlteradoPor && req?.user?.id
        ? { alteradoPorUsuarioId: req.user.id }
        : {}),
    });
  }

  @Patch(':id')
  @Permissoes('agendamentos.editar')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendaDto,
    @Req() req?: any,
  ) {
    await this.garantirSetorFabrica(+id);
    const { pode, registrarAlteradoPor } = await this.podeEditarAgendaFabrica(
      +id,
      req,
    );
    if (!pode) {
      throw new ForbiddenException(
        'Só o responsável pela tarefa ou um administrador pode alterar.',
      );
    }
    return this.agendaService.update(+id, dto, {
      setorDestino: SETOR_FABRICA,
      ...(registrarAlteradoPor && req?.user?.id
        ? { alteradoPorUsuarioId: req.user.id }
        : {}),
    });
  }

  @Post('purge-cancelados')
  @Permissoes('agendamentos.excluir')
  async purgeCancelados() {
    return this.agendaService.purgeCancelados('FABRICA');
  }

  @Delete(':id')
  @Permissoes('agendamentos.excluir')
  async remove(@Param('id') id: string, @Req() req?: any) {
    await this.garantirSetorFabrica(+id);
    const { pode, registrarAlteradoPor } = await this.podeEditarAgendaFabrica(
      +id,
      req,
    );
    if (!pode) {
      throw new ForbiddenException(
        'Só o responsável pela tarefa ou um administrador pode excluir.',
      );
    }
    return this.agendaService.cancel(+id, {
      setor: 'FABRICA',
      ...(registrarAlteradoPor && req?.user?.id
        ? { alteradoPorUsuarioId: req.user.id }
        : {}),
    });
  }
}
