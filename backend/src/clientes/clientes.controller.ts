import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { PIPELINE_CLIENTE } from '../shared/constantes/status-matrix';

@UseGuards(PermissionsGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  @Permissoes('clientes.criar')
  criar(
    @Body() dto: CriarClienteDto,
    @Req() req?: { user?: { funcionario_id?: number | null } },
  ) {
    return this.service.criar(dto, req?.user);
  }

  @Get()
  @Permissoes('clientes.ver')
  listar(@Req() req: { user?: { funcionario_id?: number | null; is_admin?: boolean } }) {
    return this.service.listar(req?.user);
  }

  // Rotas de relatórios antes do :id (ok)
  /** IDs de clientes com status AGENDAR_MEDIDA_FINA e parcela vencida no Contas a Receber (para alerta no Fluxo de Clientes). */
  @Get('relatorios/pendencias-agendamento')
  @Permissoes('clientes.ver')
  pendenciasAgendamento() {
    return this.service.getPendenciasAgendamento();
  }

  @Get('relatorios/aniversariantes')
  @Permissoes('clientes.ver') // (ou 'clientes.relatorios' se você tiver essa chave)
  aniversariantes(
    @Query('data') data?: string,
    @Query('enviar') enviar?: 'email' | 'whatsapp',
  ) {
    const hoje = new Date().toISOString().slice(0, 10);
    return this.service.aniversariantesDoDia(data ?? hoje, enviar);
  }

  @Get('pipeline')
  @Permissoes('clientes.ver')
  pipeline() {
    return PIPELINE_CLIENTE;
  }

  @Get('select')
  @Permissoes('clientes.select', 'clientes.ver')
  select(
    @Query('q') q?: string,
    @Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
  ) {
    return this.service.select(q, req?.user);
  }

  @Get(':id')
  @Permissoes('clientes.ver')
  buscar(
    @Param('id') id: string,
    @Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
  ) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.buscarPorId(cleanId, req?.user);
  }

  @Put(':id')
  @Permissoes('clientes.editar')
  atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarClienteDto,
    @Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
  ) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.atualizar(cleanId, dto, req?.user);
  }

  @Delete(':id')
  @Permissoes('clientes.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @Param('id') id: string,
    @Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } },
  ) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.remover(cleanId, req?.user);
  }
}
