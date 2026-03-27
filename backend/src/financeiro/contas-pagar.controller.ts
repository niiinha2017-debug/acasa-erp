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
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { FinanceiroService } from './financeiro.service';
import { FecharMesDto } from './dto/fechar-mes.dto';
import { FecharMesFuncionarioDto } from './dto/fechar-mes-funcionario.dto';
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

  // ✅ TODAS AS ABAS DE UMA VEZ — reduz 5 requisições para 1
  @Get('todas-abas')
  @Permissoes('contas_pagar.ver')
  async todasAbas(
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('funcionario_id') funcionario_id?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    try {
      await this.service.atualizarVencidos();
    } catch (err) {
      this.logger.warn('atualizarVencidos falhou (todas-abas continua):', err?.message || err);
    }

    const params = {
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
      fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
      funcionario_id: funcionario_id ? this.cleanIdOrFail(funcionario_id) : undefined,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
    };

    const [unificado, paraFechar, compensados, agendados, pagos] = await Promise.all([
      this.service.listarContasPagarConsolidado(params),
      this.service.listarContasPagarPorAba({ ...params, visao: 'PARA_FECHAR' }),
      this.service.listarContasPagarPorAba({ ...params, visao: 'COMPENSADOS' }),
      this.service.listarContasPagarPorAba({ ...params, visao: 'AGENDADOS' }),
      this.service.listarContasPagarPorAba({ ...params, visao: 'PAGOS' }),
    ]);

    return { unificado, paraFechar, compensados, agendados, pagos };
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
    @Query('funcionario_id') funcionario_id?: string,
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
        fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
        funcionario_id: funcionario_id ? this.cleanIdOrFail(funcionario_id) : undefined,
        mes: mes ? Number(mes) : undefined,
        ano: ano ? Number(ano) : undefined,
      });
    }

    return this.service.listarContasPagarConsolidado({
      status: status?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
      fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
      funcionario_id: funcionario_id ? this.cleanIdOrFail(funcionario_id) : undefined,
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
    });
  }

  // ✅ LISTA FECHAMENTO POR FORNECEDOR (agrupado por fornecedor + mês/ano)
  @Get('fechamento-por-fornecedor')
  @Permissoes('contas_pagar.ver')
  async listarFechamentoPorFornecedor(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('fornecedor_id') fornecedor_id?: string,
  ) {
    const mesNum = mes ? Number(mes) : new Date().getMonth() + 1;
    const anoNum = ano ? Number(ano) : new Date().getFullYear();
    return this.service.listarFechamentoPorFornecedor({
      mes: Number.isFinite(mesNum) ? mesNum : new Date().getMonth() + 1,
      ano: Number.isFinite(anoNum) ? anoNum : new Date().getFullYear(),
      fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
    });
  }

  // ✅ FECHAMENTOS
  @Get('fechamentos')
  @Permissoes('contas_pagar.ver')
  async listarFechamentos(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('funcionario_id') funcionario_id?: string,
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
      funcionario_id: funcionario_id
        ? this.cleanIdOrFail(funcionario_id)
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

  // ✅ FECHAR MÊS FUNCIONÁRIO (consolida folha e gera conta_pagar)
  @Post('fechar-mes-funcionario')
  @Permissoes('contas_pagar.criar')
  @HttpCode(HttpStatus.OK)
  async fecharMesFuncionario(@Body() body: FecharMesFuncionarioDto) {
    try {
      return await this.service.fecharMesFuncionario(body);
    } catch (err: any) {
      if (err?.statusCode >= 400 && err?.statusCode < 500) throw err;
      const msg = err?.message || String(err);
      const stack = err?.stack;
      this.logger.error(`fechar-mes-funcionario 500: ${msg}`, stack);
      throw new InternalServerErrorException(
        msg || 'Erro ao fechar mês do funcionário. Verifique os logs do servidor.',
      );
    }
  }

  // ✅ RELATÓRIO CONTAS A PAGAR — dados agregados
  @Get('relatorio')
  @Permissoes('contas_pagar.ver')
  async relatorio(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('forma_pagamento') forma_pagamento?: string,
    @Query('status') status?: string,
  ) {
    return this.service.gerarRelatorioContasPagar({
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
      fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
      forma_pagamento: forma_pagamento?.trim() || undefined,
      status: status?.trim() || undefined,
    });
  }

  // ✅ RELATÓRIO CONTAS A PAGAR — PDF
  @Get('relatorio/pdf')
  @Permissoes('contas_pagar.ver')
  async relatorioPdf(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('forma_pagamento') forma_pagamento?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.service.gerarRelatorioContasPagarPdf({
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
      fornecedor_id: fornecedor_id ? this.cleanIdOrFail(fornecedor_id) : undefined,
      forma_pagamento: forma_pagamento?.trim() || undefined,
      status: status?.trim() || undefined,
    });

    const mesStr = mes || String(new Date().getMonth() + 1);
    const anoStr = ano || String(new Date().getFullYear());
    const filename = `relatorio-contas-pagar-${mesStr.padStart(2, '0')}-${anoStr}.pdf`;

    res!.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
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
