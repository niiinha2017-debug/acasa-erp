// src/agenda/agenda.controller.ts
import { Controller, Get, Post, Body, Param, Query, Patch, Delete } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  // 1. Criar agendamento (Venda, Orçamento ou Plano de Corte)
  @Post()
  async create(@Body() createAgendaDto: CreateAgendaDto) {
    return this.agendaService.create(createAgendaDto);
  }

  // 2. Buscar TODOS os agendamentos (Visão do Administrador/Escritório)
  // Aceita filtros por data: /agenda?inicio=2024-05-01&fim=2024-05-31
  @Get()
  async findAll(
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    return this.agendaService.findAll(inicio, fim);
  }

  // 3. Buscar agendamentos de UM funcionário específico (Visão do Marceneiro)
  @Get('funcionario/:id')
  async findByFuncionario(@Param('id') id: string) {
    return this.agendaService.findByFuncionario(+id);
  }

  // 4. Atualizar Status (Para o marceneiro marcar como "FINALIZADO")
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.agendaService.updateStatus(+id, status);
  }

  // 5. Deletar agendamento
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.agendaService.remove(+id);
  }
}