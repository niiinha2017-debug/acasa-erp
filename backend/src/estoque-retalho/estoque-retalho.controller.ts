import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
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
  listar(@Query('produto_id') produtoId?: string, @Query('status') status?: string) {
    const produto_id = produtoId ? Number(produtoId) : undefined;
    return this.service.listar({ produto_id, status });
  }

  @Get('por-produto/:produtoId')
  @Permissoes('produtos.ver')
  listarPorProduto(@Param('produtoId') produtoId: string) {
    return this.service.listarPorProduto(Number(produtoId));
  }

  @Get(':id')
  @Permissoes('produtos.ver')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(Number(id));
  }

  @Post()
  @Permissoes('produtos.editar')
  criar(
    @Body()
    dto: {
      produto_id: number;
      agenda_fabrica_id?: number;
      largura_mm: number;
      comprimento_mm: number;
      imagem_url?: string;
      observacao?: string;
    },
  ) {
    return this.service.criar(dto);
  }

  @Put(':id')
  @Permissoes('produtos.editar')
  atualizar(
    @Param('id') id: string,
    @Body()
    dto: {
      largura_mm?: number;
      comprimento_mm?: number;
      status?: string;
      imagem_url?: string;
      observacao?: string;
    },
  ) {
    return this.service.atualizar(Number(id), dto);
  }

  @Delete(':id')
  @Permissoes('produtos.excluir')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id));
  }

  @Get(':id/etiqueta')
  @Permissoes('produtos.ver')
  async gerarEtiqueta(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.gerarEtiqueta(Number(id));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=etiqueta-sobra-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
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
