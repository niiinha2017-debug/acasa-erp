// Agenda Loja: apenas eventos com setor_destino = LOJA
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { normalizarOrigemFluxo } from './agenda-rules';

const SETOR_LOJA = 'LOJA';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('agenda-loja')
export class AgendaLojaController {
  constructor(private readonly agendaService: AgendaService) {}

  /**
   * Regra (todas as páginas): usuário só altera o que ele mesmo criou; admin altera qualquer um.
   * Quando admin altera, registra "alterado por" para auditoria.
   */
  private async podeEditarAgendaLoja(id: number, req: any): Promise<{ pode: boolean; registrarAlteradoPor: boolean }> {
    const user = req?.user;
    if (!user) return { pode: false, registrarAlteradoPor: false };
    const isAdmin = user.is_admin === true;
    if (isAdmin) return { pode: true, registrarAlteradoPor: true };
    const agenda = await this.agendaService.findOneLojaParaPermissao(id);
    if (!agenda) return { pode: false, registrarAlteradoPor: false };
    const criadoPorUserId = agenda.criado_por_usuario_id != null ? Number(agenda.criado_por_usuario_id) : null;
    const userId = user.id != null ? Number(user.id) : null;
    const foiCriadoPorMim = userId != null && criadoPorUserId === userId;
    return { pode: foiCriadoPorMim, registrarAlteradoPor: false };
  }

  @Get()
  @Permissoes('agendamentos.vendas')
  async findAll(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @Query('status') status?: string,
    @Query('funcionario_id') funcionarioId?: string,
    @Query('incluir_cancelados') incluirCancelados?: string,
    @Query('origem_fluxo') origemFluxoQuery?: string,
  ) {
    return this.agendaService.findAll(inicio, fim, {
      setorDestino: SETOR_LOJA,
      includePlanoCorte: false,
      status,
      funcionarioId: funcionarioId ? Number(funcionarioId) : undefined,
      origemFluxo: normalizarOrigemFluxo(origemFluxoQuery) || undefined,
      incluirCancelados:
        String(incluirCancelados || '').toLowerCase() === 'true' ||
        incluirCancelados === '1',
    });
  }

  @Post()
  @Permissoes('agendamentos.vendas')
  async create(@Body() dto: CreateAgendaDto, @Req() req?: any) {
    return this.agendaService.create(
      { ...dto, setor_destino: SETOR_LOJA },
      req?.user?.id ? { criadoPorUsuarioId: req.user.id } : undefined,
    );
  }

  @Get('funcionario/:id')
  @Permissoes('agendamentos.vendas')
  async findByFuncionario(@Param('id') id: string) {
    return this.agendaService.findByFuncionario(+id, SETOR_LOJA);
  }

  private async garantirSetorLoja(id: number) {
    const ag = await this.agendaService.findOneLoja(id);
    if (!ag) {
      throw new ForbiddenException(
        'Este agendamento pertence à agenda da fábrica e não pode ser alterado aqui.',
      );
    }
  }

  @Patch(':id/status')
  @Permissoes('agendamentos.vendas')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('categoria') categoria?: string,
    @Req() req?: any,
  ) {
    await this.garantirSetorLoja(+id);
    const { pode, registrarAlteradoPor } = await this.podeEditarAgendaLoja(+id, req);
    const statusNorm = String(status || '').toUpperCase();
    const soConcluir = statusNorm === 'CONCLUIDO' && !categoria;
    if (!pode && !soConcluir) {
      throw new ForbiddenException('Você só pode alterar agendamentos que você mesmo criou.');
    }
    return this.agendaService.updateStatus(
      +id,
      status,
      categoria,
      (pode && registrarAlteradoPor && req?.user?.id) ? { alteradoPorUsuarioId: req.user.id } : soConcluir && req?.user?.id ? { alteradoPorUsuarioId: req.user.id } : undefined,
    );
  }

  @Patch(':id')
  @Permissoes('agendamentos.vendas')
  async update(@Param('id') id: string, @Body() dto: UpdateAgendaDto, @Req() req?: any) {
    await this.garantirSetorLoja(+id);
    const { pode, registrarAlteradoPor } = await this.podeEditarAgendaLoja(+id, req);
    if (!pode) {
      throw new ForbiddenException('Você só pode alterar agendamentos que você mesmo criou.');
    }
    return this.agendaService.update(
      +id,
      dto,
      registrarAlteradoPor && req?.user?.id ? { alteradoPorUsuarioId: req.user.id } : undefined,
    );
  }

  @Patch(':id/enviar-producao')
  @Permissoes('agendamentos.vendas')
  async enviarParaProducao(@Param('id') id: string, @Req() req?: any) {
    await this.garantirSetorLoja(+id);
    const { pode } = await this.podeEditarAgendaLoja(+id, req);
    if (!pode) {
      throw new ForbiddenException('Você só pode enviar para produção agendamentos que você mesmo criou.');
    }
    return this.agendaService.enviarParaProducao(+id);
  }

  @Post('purge-cancelados')
  @Permissoes('agendamentos.vendas')
  async purgeCancelados() {
    return this.agendaService.purgeCancelados('LOJA');
  }

  @Delete(':id')
  @Permissoes('agendamentos.vendas')
  async remove(@Param('id') id: string, @Req() req?: any) {
    await this.garantirSetorLoja(+id);
    const { pode, registrarAlteradoPor } = await this.podeEditarAgendaLoja(+id, req);
    if (!pode) {
      throw new ForbiddenException('Você só pode excluir agendamentos que você mesmo criou.');
    }
    return this.agendaService.cancel(+id, {
      setor: 'LOJA',
      ...(registrarAlteradoPor && req?.user?.id ? { alteradoPorUsuarioId: req.user.id } : {}),
    });
  }
}
