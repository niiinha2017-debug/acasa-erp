import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('relatorios/servico-corte')
export class RelatorioServicosCorteController {
  constructor(private readonly financeiro: FinanceiroService) {}

  private cleanIdOrFail(raw: string | number): number {
    const n = Number(String(raw).replace(/\D/g, ''));
    if (!Number.isFinite(n) || n <= 0) return undefined as any;
    return n;
  }

  @Get()
  @Permissoes('plano_corte.ver')
  getRelatorio(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('fornecedor_id') fornecedorId?: string,
    @Query('status') status?: string,
  ) {
    return this.financeiro.gerarRelatorioServicosCorte({
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
      fornecedor_id: fornecedorId ? this.cleanIdOrFail(fornecedorId) : undefined,
      status: status?.trim() || undefined,
    });
  }

  @Get('pdf')
  @Permissoes('plano_corte.ver')
  async getRelatorioPdf(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('fornecedor_id') fornecedorId?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.financeiro.gerarRelatorioServicosCortePdf({
      mes: mes ? Number(mes) : undefined,
      ano: ano ? Number(ano) : undefined,
      fornecedor_id: fornecedorId ? this.cleanIdOrFail(fornecedorId) : undefined,
      status: status?.trim() || undefined,
    });

    const mesStr = mes || String(new Date().getMonth() + 1);
    const anoStr = ano || String(new Date().getFullYear());
    const filename = `relatorio-servico-corte-${mesStr.padStart(2, '0')}-${anoStr}.pdf`;

    res!.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res!.end(buffer);
  }
}
