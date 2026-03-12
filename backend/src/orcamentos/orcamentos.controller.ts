import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { OrcamentosService } from './orcamentos.service';
import { OrcamentoTecnicoService } from '../orcamento-tecnico/orcamento-tecnico.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto';
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto';

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('orcamentos')
export class OrcamentosController {
  constructor(
    private readonly service: OrcamentosService,
    private readonly orcamentoTecnicoService: OrcamentoTecnicoService,
  ) {}

  // ----- Orçamento Técnico (lista/detalhe/criar) — rotas fixas antes de :id -----
  @Get('tecnico-lista')
  @Permissoes('agendamentos.producao')
  listarOrcamentoTecnico(@Query('agenda_loja_id') agendaLojaId?: string) {
    const id = agendaLojaId ? Number(agendaLojaId) : undefined;
    return this.orcamentoTecnicoService.listar(id);
  }

  @Get('tecnico/:id')
  @Permissoes('agendamentos.producao')
  buscarOrcamentoTecnico(@Param('id') id: string) {
    return this.orcamentoTecnicoService.buscarPorId(Number(id) || 0);
  }

  @Post('tecnico-novo')
  @Permissoes('agendamentos.producao')
  criarOrcamentoTecnico(@Body() body: { agenda_loja_id: number; ambiente_ids: number[] }) {
    const agendaLojaId = Number(body?.agenda_loja_id);
    const ambienteIds = Array.isArray(body?.ambiente_ids) ? body.ambiente_ids.map(Number).filter((i) => i > 0) : [];
    return this.orcamentoTecnicoService.criarDeMedicao(agendaLojaId, ambienteIds);
  }

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  @Get('aguardando-apresentacao')
  @Permissoes('agendamentos.ver', 'agendamentos.vendas', 'agendamentos.criar')
  listarAguardandoApresentacao() {
    return this.service.listarAguardandoApresentacao();
  }

  @Get()
  @Permissoes('orcamentos.ver', 'vendas.fechamento.ver')
  listar(@Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } }) {
    return this.service.listar(req?.user);
  }

  @Get(':id')
  @Permissoes('orcamentos.ver')
  detalhar(@Param('id') id: string) {
    return this.service.detalhar(this.cleanId(id));
  }

  @Post()
  @Permissoes('orcamentos.criar')
  criar(@Body() dto: CreateOrcamentoDto) {
    const clienteId = this.cleanId(String(dto?.cliente_id ?? ''));
    return this.service.criar({ ...dto, cliente_id: clienteId });
  }

  @Put(':id')
  @Permissoes('orcamentos.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateOrcamentoDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  // =========================
  // CLÁUSULAS ESPECÍFICAS
  // =========================

  @Put(':id/clausulas')
  @Permissoes('orcamentos.clausulas.editar')
  salvarClausulas(
    @Param('id') id: string,
    @Body()
    body: {
      clausulas?: { modulo_key?: string; titulo?: string; texto?: string }[];
    },
  ) {
    return this.service.salvarClausulas(this.cleanId(id), body);
  }

  @Delete(':id')
  @Permissoes('orcamentos.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }

  // =========================
  // ITENS
  // =========================

  @Post(':id/itens')
  @Permissoes('orcamentos.editar')
  adicionarItem(@Param('id') id: string, @Body() dto: CreateOrcamentoItemDto) {
    return this.service.adicionarItem(this.cleanId(id), dto);
  }

  @Put(':id/itens/:itemId')
  @Permissoes('orcamentos.editar')
  atualizarItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrcamentoItemDto,
  ) {
    return this.service.atualizarItem(
      this.cleanId(id),
      this.cleanId(itemId),
      dto,
    );
  }

  @Delete(':id/itens/:itemId')
  @Permissoes('orcamentos.editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removerItem(this.cleanId(id), this.cleanId(itemId));
  }

  // =========================
  // PDF
  // =========================

  @Post(':id/enviar-whatsapp')
  @Permissoes('orcamentos.ver')
  @HttpCode(HttpStatus.OK)
  async enviarPorWhatsapp(@Param('id') id: string) {
    return this.service.enviarPorWhatsApp(this.cleanId(id));
  }

  @Post(':id/pdf')
  @Permissoes('orcamentos.ver')
  @HttpCode(HttpStatus.OK)
  async gerarPdfSalvar(
    @Param('id') id: string,
    @Body() body: { incluirTermos?: boolean },
  ) {
    const orcId = this.cleanId(id);
    return this.service.gerarPdfESalvar(orcId, {
      incluirTermos: body?.incluirTermos === true,
    });
  }
}
