import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

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
  @Permissoes('agendamentos.vendas')
  listarOrcamentoTecnico(@Query('agenda_loja_id') agendaLojaId?: string) {
    const id = agendaLojaId ? Number(agendaLojaId) : undefined;
    return this.orcamentoTecnicoService.listar(id);
  }

  @Get('tecnico/:id')
  @Permissoes('agendamentos.vendas')
  buscarOrcamentoTecnico(@Param('id') id: string) {
    return this.orcamentoTecnicoService.buscarPorId(Number(id) || 0);
  }

  @Post('tecnico-novo')
  @Permissoes('agendamentos.vendas')
  criarOrcamentoTecnico(@Body() body: { agenda_loja_id: number; ambiente_ids: number[] }) {
    const agendaLojaId = Number(body?.agenda_loja_id);
    const ambienteIds = Array.isArray(body?.ambiente_ids) ? body.ambiente_ids.map(Number).filter((i) => i > 0) : [];
    return this.orcamentoTecnicoService.criarDeMedicao(agendaLojaId, ambienteIds);
  }

  @Post('tecnico-direto')
  @Permissoes('agendamentos.vendas')
  criarOrcamentoTecnicoDireto(
    @Body()
    body: {
      cliente_id?: number;
      cliente_rapido?: {
        nome_completo?: string;
        telefone?: string;
        whatsapp?: string;
        email?: string;
      };
    },
  ) {
    return this.orcamentoTecnicoService.criarDireto({
      cliente_id: Number(body?.cliente_id || 0) || undefined,
      cliente_rapido: body?.cliente_rapido,
    });
  }

  @Post('tecnico/:id/finalizar')
  @Permissoes('agendamentos.vendas')
  finalizarOrcamentoTecnico(
    @Param('id') id: string,
    @Body()
    body: {
      ambientes?: Array<{
        id?: string;
        nome?: string;
        medidaVendedor?: { largura_m?: number; altura_m?: number; profundidade_m?: number };
        medidaTecnica?: { largura_m?: number; altura_m?: number; profundidade_m?: number };
        itens?: Array<{
          descricao?: string;
          material?: string;
          quantidade?: number;
          area_m2?: number;
          custo_unitario?: number;
          preco_unitario?: number;
          origem?: string;
        }>;
      }>;
    },
  ) {
    return this.orcamentoTecnicoService.finalizarOrcamento(Number(id) || 0, body || {});
  }

  /**
   * Importa arquivo CSV ou XML (Promob / Corte Cloud) e retorna o custo real de material
   * cruzado com preços da Aba 1 + Aba 2, somado à estimativa de RH da Aba 3.
   * Enviar como multipart/form-data com campo "arquivo".
   * Body adicional (form fields): hora_homem_value, custo_fixo_fabrica_value, acrescimo_pct
   */
  @Post('tecnico-importar')
  @Permissoes('agendamentos.vendas')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const ext = (file.originalname || '').split('.').pop()?.toLowerCase();
        if (ext === 'csv' || ext === 'xml' || ext === 'txt') {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos CSV ou XML são aceitos.'), false);
        }
      },
    }),
  )
  importarProjeto(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body() body: {
      hora_homem_value?: string;
      custo_fixo_fabrica_value?: string;
      acrescimo_pct?: string;
      orcamento_tecnico_id?: string;
    },
  ) {
    if (!arquivo?.buffer) {
      throw new Error('Nenhum arquivo enviado.');
    }
    return this.orcamentoTecnicoService.importarProjeto(arquivo.buffer, arquivo.originalname, {
      hora_homem_value: Number(body?.hora_homem_value ?? 0),
      custo_fixo_fabrica_value: Number(body?.custo_fixo_fabrica_value ?? 0),
      acrescimo_pct: Number(body?.acrescimo_pct ?? 0),
      orcamento_tecnico_id: Number(body?.orcamento_tecnico_id ?? 0),
    });
  }

  /**
   * Vincula os itens importados à categoria comercial real de cada produto
    * (PRIMARIA = Essencial, SECUNDARIA = Desgner, TERCIARIA = Premiun),
   * aplica CMV por m² por categoria e devolve pendentes para classificação manual.
   * Body: { itens, hora_homem_value?, custo_fixo_fabrica_value?, acrescimo_pct? }
   */
  @Post('tecnico-vincular')
  @Permissoes('agendamentos.vendas')
  vincularMateriais(
    @Body()
    body: {
      itens: Array<{
        nome_original: string;
        espessura_mm?: number | null;
        area_m2: number;
        preco_m2: number;
        produto_id: number | null;
        produto_nome?: string | null;
        tipo?: string;
        custo_total: number;
        encontrado: boolean;
        categoria_manual?: string | null;
      }>;
      hora_homem_value?: number;
      custo_fixo_fabrica_value?: number;
      acrescimo_pct?: number;
      orcamento_tecnico_id?: number;
      preco_estimado_vendedor?: number;
    },
  ) {
    if (!Array.isArray(body?.itens) || body.itens.length === 0) {
      throw new BadRequestException('Lista de itens não pode ser vazia.');
    }
    return this.orcamentoTecnicoService.vincularMateriais(body);
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

