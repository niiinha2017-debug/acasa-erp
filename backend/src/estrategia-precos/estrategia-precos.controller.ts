import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { PriceStrategyFiltersDto } from './dto/price-strategy-filters.dto';
import { UpdateSearchStrategyDto } from './dto/update-search-strategy.dto';
import { EstrategiaPrecosService } from './estrategia-precos.service';

type SearchStrategy = 'MIN_PRICE' | 'AVG_PRICE' | 'MAX_PRICE';

@UseGuards(PermissionsGuard)
@Controller('configuracoes/estrategia-precos')
export class EstrategiaPrecosController {
  constructor(private readonly service: EstrategiaPrecosService) {}

  @Get()
  @Permissoes('configuracoes.estrategia_precos.ver')
  buscarConfig() {
    return this.service.getConfig();
  }

  @Patch()
  @Permissoes('configuracoes.estrategia_precos.editar')
  atualizarEstrategia(@Body() dto: UpdateSearchStrategyDto) {
    return this.service.updateStrategy(dto.search_strategy as SearchStrategy);
  }

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
  buscarMateriaisMdf(@Query('termo') termo?: string, @Query('strategy') strategy?: SearchStrategy) {
    return this.service.buscarReferenciasMdfPorTermo(String(termo || ''), strategy ?? 'AVG_PRICE');
  }

  @Get('materiais-mdf/por-categoria')
  @Permissoes('configuracoes.estrategia_precos.ver')
  buscarMdfPorCategoria(
    @Query('categoria_comercial') categoriaComercial?: string,
    @Query('strategy') strategy?: SearchStrategy,
  ) {
    return this.service.buscarMdfPorCategoriaComercial(
      categoriaComercial ?? 'PRIMARIA',
      strategy ?? 'AVG_PRICE',
    );
  }

  @Get('insumos-fixos')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarInsumosFixos() {
    return this.service.listarInsumosFixos();
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
        acrescimo_pct?: number;
        area_m2?: number;
      }>;
      kit_items?: Array<{ name?: string; value?: number; selected?: boolean }>;
      hora_homem_value?: number;
      custo_fixo_fabrica_value?: number;
      fix_insumo_per_m2?: number;
    },
  ) {
    return this.service.processOperationalMatrix(body ?? {});
  }

  @Get('matriz-operacional')
  @Permissoes('configuracoes.estrategia_precos.ver')
  listarMatriz(@Query() filters: PriceStrategyFiltersDto) {
    return this.service.listarMatrizOperacional(filters);
  }
}
