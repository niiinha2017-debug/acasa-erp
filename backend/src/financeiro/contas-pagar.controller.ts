import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { FecharMesDto } from './dto/fechar-mes.dto';
import { CreateContaPagarDto } from './dto/create-conta-pagar.dto';
import { UpdateContaPagarDto } from './dto/update-conta-pagar.dto';
import { PagarContaPagarDto } from './dto/pagar-conta-pagar.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('financeiro/contas-pagar')
export class ContasPagarController {
  private readonly logger = new Logger(ContasPagarController.name);

  constructor(private readonly service: FinanceiroService) {}

  private cleanIdOrFail(id: string | number): number {
    const n = Number(String(id).replace(/\D/g, ''));
    if (!Number.isFinite(n) || n <= 0)
      throw new BadRequestException('id inválido');
    return n;
  }

  // ✅ Dashboard: Total a Vencer (Mês), Cheques a Compensar, Créditos Disponíveis
  @Get('dashboard')
  @Permissoes('contas_pagar.ver')
  async dashboard(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    const mesNum = mes ? Number(mes) : undefined;
    const anoNum = ano ? Number(ano) : undefined;
    return this.service.getContasPagarDashboard({
      mes: Number.isFinite(mesNum) ? mesNum : undefined,
      ano: Number.isFinite(anoNum) ? anoNum : undefined,
    });
  }

  // ✅ LISTA POR ABA (Para Fechar | Agendados | Pagos) ou consolidada unificada
  @Get()
  @Permissoes('contas_pagar.ver')
  async listar(
    @Query('visao') visao?: string,
    @Query('status') status?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    try {
      await this.service.atualizarVencidos();
    } catch (err) {
      this.logger.warn('atualizarVencidos falhou (listagem continua):', err?.message || err);
    }

    const visaoNorm = (visao || '').trim().toUpperCase();
    if (visaoNorm === 'PARA_FECHAR' || visaoNorm === 'COMPENSADOS' || visaoNorm === 'AGENDADOS' || visaoNorm === 'PAGOS') {
      return this.service.listarContasPagarPorAba({
        visao: visaoNorm as 'PARA_FECHAR' | 'COMPENSADOS' | 'AGENDADOS' | 'PAGOS',
        data_ini: data_ini?.trim() || undefined,
        data_fim: data_fim?.trim() || undefined,
      });
    }

    return this.service.listarContasPagarConsolidado({
      status: status?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
      fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
    });
  }

  // ✅ FECHAMENTOS
  @Get('fechamentos')
  @Permissoes('contas_pagar.ver')
  async listarFechamentos(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    try {
      await this.service.atualizarVencidos();
    } catch (err) {
      this.logger.warn('atualizarVencidos falhou (listagem continua):', err?.message || err);
    }

    return this.service.listarContasPagarFechamentos({
      fornecedor_id: fornecedor_id
        ? this.cleanIdOrFail(fornecedor_id)
        : undefined,
      status: status?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
    });
  }

  // ✅ Painel de Obras Vigentes (obras em medição, produção ou montagem)
  @Get('painel-obras-vigentes')
  @Permissoes('contas_pagar.ver')
  painelObrasVigentes(@Req() req?: { user?: { funcionario_id?: number | null; is_admin?: boolean } }) {
    return this.service.getPainelObrasVigentes(req?.user);
  }

  // ✅ PREVIEW DO FECHAMENTO (Etapa 1 do modal — não salva)
  @Get('preview-fechamento')
  @Permissoes('contas_pagar.ver')
  async previewFechamento(
    @Query('fornecedor_id') fornecedor_id: string,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    return this.service.previewFechamentoFornecedor({
      fornecedor_id: this.cleanIdOrFail(fornecedor_id),
      mes: Number(mes),
      ano: Number(ano),
    });
  }

  // ✅ FECHAR MÊS (Etapa 2 do modal — cria contas_pagar + titulos_financeiros)
  @Post('fechar-mes')
  @Permissoes('contas_pagar.criar')
  @HttpCode(HttpStatus.OK)
  async fecharMes(@Body() body: FecharMesDto) {
    try {
      return await this.service.fecharMesFornecedorComTitulos(body);
    } catch (err: any) {
      if (err?.statusCode >= 400 && err?.statusCode < 500) throw err;
      const msg = err?.message || String(err);
      const stack = err?.stack;
      this.logger.error(`fechar-mes 500: ${msg}`, stack);
      throw new InternalServerErrorException(
        msg || 'Erro ao fechar mês. Verifique os logs do servidor.',
      );
    }
  }

  // ✅ Dar baixa em parcela (título) de despesa
  @Post('titulo/:id/pagar')
  @Permissoes('contas_pagar.editar')
  @HttpCode(HttpStatus.OK)
  pagarTitulo(@Param('id') id: string, @Body() dto: { data_pagamento?: string } = {}) {
    return this.service.pagarTitulo(this.cleanIdOrFail(id), dto);
  }

  // ✅ Dar baixa em despesa à vista (sem parcelas)
  @Post('despesa/:id/pagar')
  @Permissoes('contas_pagar.editar')
  @HttpCode(HttpStatus.OK)
  pagarDespesa(@Param('id') id: string, @Body() dto: { data_pagamento?: string } = {}) {
    return this.service.pagarDespesa(this.cleanIdOrFail(id), dto);
  }

  // ✅ DETALHE (sempre depois das rotas fixas)
  @Get(':id')
  @Permissoes('contas_pagar.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaPagar(this.cleanIdOrFail(id));
  }

  @Post()
  @Permissoes('contas_pagar.criar')
  criar(@Body() dto: CreateContaPagarDto) {
    return this.service.criarContaPagar(dto);
  }

  @Put(':id')
  @Permissoes('contas_pagar.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateContaPagarDto) {
    return this.service.atualizarContaPagar(this.cleanIdOrFail(id), dto);
  }

  @Post(':id/pagar')
  @Permissoes('contas_pagar.editar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() dto: PagarContaPagarDto) {
    // (mantém por enquanto; o fluxo novo usa títulos)
    return this.service.pagarContaPagar(this.cleanIdOrFail(id), dto);
  }

  @Delete(':id')
  @Permissoes('contas_pagar.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remover(@Param('id') id: string): Promise<void> {
    await this.service.removerContaPagar(this.cleanIdOrFail(id));
  }
}
