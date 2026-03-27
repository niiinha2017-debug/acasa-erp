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

import { OrcamentosService } from './orcamentos.service';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto';
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto';

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly service: OrcamentosService) {}

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

  @Get('clausulas-padrao')
  @Permissoes('orcamentos.ver')
  listarClausulasPadrao() {
    return this.service.listarClausulasPadrao();
  }

  @Get(':id')
  @Permissoes('orcamentos.ver')
  detalhar(@Param('id') id: string) {
    return this.service.detalhar(this.cleanId(id));
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
    @Body() body: {
      incluirTermos?: boolean;
      dadosTecnicos?: {
        chapas_inteiras_total?: number;
        custo_chapas_total?: number;
        custo_pecas_terceiros?: number;
        custo_rh_estimado?: number;
        custo_total_producao?: number;
        margem_lucro_pct?: number;
        preco_venda_sugerido?: number;
      };
      rodapeComercial?: {
        validade_data?: string;
        valor_entrada?: number;
        quantidade_parcelas?: number;
        observacoes_pagamento?: string;
        prazo_entrega_dias_uteis?: number;
      };
    },
  ) {
    const orcId = this.cleanId(id);
    return this.service.gerarPdfESalvar(orcId, {
      incluirTermos: body?.incluirTermos === true,
      dadosTecnicos: body?.dadosTecnicos,
      rodapeComercial: body?.rodapeComercial,
    });
  }

}
