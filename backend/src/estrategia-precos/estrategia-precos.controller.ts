import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { PriceStrategyFiltersDto } from './dto/price-strategy-filters.dto';
import { EstrategiaPrecosService } from './estrategia-precos.service';

@UseGuards(PermissionsGuard)
@Controller('configuracoes/estrategia-precos')
export class EstrategiaPrecosController {
  constructor(private readonly service: EstrategiaPrecosService) {}

  @Get('produto-referencia')
  @Permissoes('configuracoes.estrategia_precos.ver')
  buscarProdutoReferencia(@Query() filters: PriceStrategyFiltersDto) {
    return this.service.buscarProdutoReferencia(filters);
  }

  @Get('materiais')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarMateriais(@Query() filters: PriceStrategyFiltersDto) {
    return this.service.listarTopMateriais(filters);
  }

  @Get('materiais-mdf')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarMateriaisMdf() {
    return this.service.listarGruposMdf();
  }

  @Get('materiais-mdf/busca')
  @Permissoes('configuracoes.estrategia_precos.ver')
  buscarMateriaisMdf(@Query('termo') termo?: string) {
    return this.service.buscarReferenciasMdfPorTermo(String(termo || ''));
  }

  @Get('materiais-mdf/por-categoria')
  @Permissoes('configuracoes.estrategia_precos.ver')
  buscarMdfPorCategoria(
    @Query('categoria_comercial') categoriaComercial?: string,
    @Query('termo') termo?: string,
  ) {
    return this.service.buscarMdfPorCategoriaComercial(
      categoriaComercial ?? 'PRIMARIA',
      termo,
    );
  }

  @Get('materiais-mdf/custo-consolidado')
  @Permissoes('configuracoes.estrategia_precos.ver', 'agendamentos.vendas')
  buscarCustoConsolidadoMdf(@Query('produto_id') produtoId?: string) {
    const id = produtoId ? Number(String(produtoId).replace(/\D/g, '')) : 0;
    return this.service.buscarCustoConsolidadoMdf(id);
  }

  @Get('insumos-fixos')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarInsumosFixos() {
    return this.service.listarInsumosFixos();
  }

  @Get('matriz-operacional/custos-internos')
  @Permissoes('configuracoes.estrategia_precos.ver', 'agendamentos.vendas')
  calcularCustosInternos(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('capacidade_m2_mes') capacidadeM2Mes?: string,
  ) {
    const mesNum = mes ? Number(String(mes).replace(/\D/g, '')) : undefined;
    const anoNum = ano ? Number(String(ano).replace(/\D/g, '')) : undefined;
    const capacidadeNum = capacidadeM2Mes ? Number(String(capacidadeM2Mes).replace(',', '.')) : undefined;

    return this.service.calcularCustosInternosPorDespesas({
      mes: Number.isFinite(mesNum) ? mesNum : undefined,
      ano: Number.isFinite(anoNum) ? anoNum : undefined,
      capacidade_m2_mes: Number.isFinite(capacidadeNum) ? capacidadeNum : undefined,
    });
  }

  @Get('matriz-operacional/custos-rh')
  @Permissoes('configuracoes.estrategia_precos.ver')
  calcularCustosRH(
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
    @Query('capacidade_m2_mes') capacidadeM2Mes?: string,
    @Query('horas_uteis_mes') horasUteisMes?: string,
  ) {
    const mesNum = mes ? Number(String(mes).replace(/\D/g, '')) : undefined;
    const anoNum = ano ? Number(String(ano).replace(/\D/g, '')) : undefined;
    const capacidadeNum = capacidadeM2Mes ? Number(String(capacidadeM2Mes).replace(',', '.')) : undefined;
    const horasNum = horasUteisMes ? Number(String(horasUteisMes).replace(',', '.')) : undefined;

    return this.service.getCalculoCustosRH({
      mes: Number.isFinite(mesNum) ? mesNum : undefined,
      ano: Number.isFinite(anoNum) ? anoNum : undefined,
      capacidade_m2_mes: Number.isFinite(capacidadeNum) ? capacidadeNum : undefined,
      horas_uteis_mes: Number.isFinite(horasNum) ? horasNum : undefined,
    });
  }

  @Post('matriz-operacional/processar')
  @Permissoes('configuracoes.estrategia_precos.editar')
  processarMatriz(
    @Body()
    body: {
      area_chapa_m2?: number;
      loss_margin_pct?: number;
      markup_base_pct?: number;
      material_links?: Array<{
        category?: string;
        thickness?: number;
        group?: string;
        adicional_fita_m2?: number;
        acrescimo_pct?: number;
        area_m2?: number;
      }>;
      kit_items?: Array<{ name?: string; value?: number; selected?: boolean }>;
      hora_homem_value?: number;
      custo_fixo_fabrica_value?: number;
      capacidade_m2_mes?: number;
      fix_insumo_per_m2?: number;
    },
  ) {
    return this.service.processOperationalMatrix(body ?? {});
  }

  @Get('matriz-operacional/selecoes')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarSelecoesMatriz() {
    return this.service.listarSelecoesMatrizOperacional();
  }

  @Get('matriz-operacional')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarMatriz(@Query() filters: PriceStrategyFiltersDto) {
    return this.service.listarMatrizOperacional(filters);
  }

  @Get('matriz-operacional/configuracoes-preco')
  @Permissoes('configuracoes.estrategia_precos.ver', 'agendamentos.vendas')
  listarConfiguracoesPreco() {
    return this.service.listarConfiguracoesPreco();
  }
}
