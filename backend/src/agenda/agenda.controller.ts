// src/agenda/agenda.controller.ts
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
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  // 1. Criar agendamento (Venda, Orçamento ou Plano de Corte)
  @Post()
  @Permissoes('agendamentos.criar')
  async create(@Body() createAgendaDto: CreateAgendaDto) {
    return this.agendaService.create(createAgendaDto);
  }

  // 2. Buscar TODOS os agendamentos (Visão do Administrador/Escritório)
  // Aceita filtros por data: /agenda?inicio=2024-05-01&fim=2024-05-31
  @Get()
  @Permissoes('agendamentos.ver')
  async findAll(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
    @Query('status') status?: string,
    @Query('funcionario_id') funcionarioId?: string,
    @Query('incluir_cancelados') incluirCancelados?: string,
    @Req() req?: any,
  ) {
    const perms: string[] = Array.isArray(req?.user?.permissoes)
      ? req.user.permissoes
      : [];
    const canVendas = perms.includes('agendamentos.vendas');
    const canProducao = perms.includes('agendamentos.producao');

    if (!canVendas && !canProducao) {
      throw new ForbiddenException('Sem permissão para acessar a agenda.');
    }

    return this.agendaService.findAll(inicio, fim, {
      includePlanoCorte: canProducao,
      status,
      funcionarioId: funcionarioId ? Number(funcionarioId) : undefined,
      incluirCancelados:
        String(incluirCancelados || '').toLowerCase() === 'true' ||
        incluirCancelados === '1',
    });
  }

  // 3. Buscar agendamentos de UM funcionário específico (Visão do Marceneiro)
  @Get('funcionario/:id')
  @Permissoes('agendamentos.ver')
  async findByFuncionario(@Param('id') id: string) {
    return this.agendaService.findByFuncionario(+id);
  }

  // 4. Atualizar Status (Para o marceneiro marcar como "CONCLUIDO" / pipeline plano corte "FINALIZADO")
  @Patch(':id/status')
  @Permissoes('agendamentos.editar')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.agendaService.updateStatus(+id, status);
  }

  // 4.1 Atualizar dados do agendamento sem recriar
  @Patch(':id')
  @Permissoes('agendamentos.editar')
  async update(@Param('id') id: string, @Body() updateAgendaDto: UpdateAgendaDto) {
    return this.agendaService.update(+id, updateAgendaDto);
  }

  // 5. Deletar agendamento
  @Delete(':id')
  @Permissoes('agendamentos.excluir')
  async remove(@Param('id') id: string) {
    return this.agendaService.cancel(+id);
  }
}
