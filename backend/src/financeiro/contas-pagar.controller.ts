import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financeiro/contas-pagar')
export class ContasPagarController {
  constructor(private readonly service: FinanceiroService) {}

  private cleanIdOrFail(id: string | number): number {
    const n = Number(String(id).replace(/\D/g, ''));
    if (!Number.isFinite(n) || n <= 0)
      throw new BadRequestException('id inválido');
    return n;
  }

  // ✅ LISTA CONSOLIDADA
  @Get()
  @Permissoes('contas_pagar.ver')
  async listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('status') status?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    await this.service.atualizarVencidos();

    return this.service.listarContasPagarConsolidado({
      fornecedor_id: fornecedor_id
        ? this.cleanIdOrFail(fornecedor_id)
        : undefined,
      status: status?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
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
    await this.service.atualizarVencidos();

    return this.service.listarContasPagarFechamentos({
      fornecedor_id: fornecedor_id
        ? this.cleanIdOrFail(fornecedor_id)
        : undefined,
      status: status?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
    });
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
  async fecharMes(@Body() body: any) {
    return this.service.fecharMesFornecedorComTitulos(body);
  }

  @Get(':id/titulos')
  @Permissoes('contas_pagar.ver')
  listarTitulos(@Param('id') id: string) {
    return this.service.listarTitulosContaPagar(this.cleanIdOrFail(id));
  }

  @Post(':id/titulos/:tituloId/pagar')
  @Permissoes('contas_pagar.editar')
  @HttpCode(HttpStatus.OK)
  pagarTitulo(
    @Param('id') id: string,
    @Param('tituloId') tituloId: string,
    @Body() dto: any,
  ) {
    return this.service.pagarTituloContaPagar(
      this.cleanIdOrFail(id),
      this.cleanIdOrFail(tituloId),
      dto,
    );
  }

  // ✅ DETALHE (sempre depois das rotas fixas)
  @Get(':id')
  @Permissoes('contas_pagar.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarContaPagar(this.cleanIdOrFail(id));
  }

  @Post()
  @Permissoes('contas_pagar.criar')
  criar(@Body() dto: any) {
    return this.service.criarContaPagar(dto);
  }

  @Put(':id')
  @Permissoes('contas_pagar.editar')
  atualizar(@Param('id') id: string, @Body() dto: any) {
    return this.service.atualizarContaPagar(this.cleanIdOrFail(id), dto);
  }

  @Post(':id/pagar')
  @Permissoes('contas_pagar.editar')
  @HttpCode(HttpStatus.OK)
  pagar(@Param('id') id: string, @Body() dto: any) {
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
