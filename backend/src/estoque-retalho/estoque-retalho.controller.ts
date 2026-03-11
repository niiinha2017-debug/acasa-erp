import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { EstoqueRetalhoService } from './estoque-retalho.service';
import { FindScrapMatchesDto } from './dto/find-scrap-matches.dto';

@UseGuards(PermissionsGuard)
@Controller('estoque/retalhos')
export class EstoqueRetalhoController {
  constructor(private readonly service: EstoqueRetalhoService) {}

  @Get()
  @Permissoes('produtos.ver')
  listar(@Query('produto_id') produtoId?: string) {
    const produto_id = produtoId ? Number(produtoId) : undefined;
    return this.service.listar({ produto_id });
  }

  @Get('por-produto/:produtoId')
  @Permissoes('produtos.ver')
  listarPorProduto(@Param('produtoId') produtoId: string) {
    return this.service.listarPorProduto(Number(produtoId));
  }

  @Post()
  @Permissoes('produtos.editar')
  criar(
    @Body()
    dto: { produto_id: number; agenda_fabrica_id?: number; largura_mm: number; comprimento_mm: number },
  ) {
    return this.service.criar(dto);
  }

  /**
   * Compara a lista de peças do Promob com a tabela de retalhos.
   * Retorna peças marcadas com "Usar Retalho ID: XXX" quando houver retalho do mesmo material e maior que a peça.
   * economia_total = valor a subtrair do custo de materiais (aumenta a margem de lucro real).
   */
  @Post('find-scrap-matches')
  @Permissoes('produtos.ver')
  findScrapMatches(@Body() dto: FindScrapMatchesDto) {
    if (!dto?.pecas?.length) {
      return { pecas: [], economia_total: 0, pecas_com_retalho: 0 };
    }
    return this.service.findScrapMatches(dto.pecas);
  }
}
