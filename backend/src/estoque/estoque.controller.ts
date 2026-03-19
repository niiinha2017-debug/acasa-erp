import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import { EstoqueService } from './estoque.service';

type ReservaPecaDto = {
  largura_mm: number;
  comprimento_mm: number;
  id_ref?: string | number;
};

type ReservaConsumoDto = {
  produto_id: number;
  quantidade_chapas?: number;
  pecas?: ReservaPecaDto[];
};

@UseGuards(PermissionsGuard)
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly service: EstoqueService) {}

  @Get('disponibilidade')
  @Permissoes('produtos.ver')
  disponibilidade(
    @Query('produto_id') produtoId?: string,
    @Query('venda_id') vendaId?: string,
  ) {
    return this.service.consultarDisponibilidade({
      produto_id: produtoId ? Number(produtoId) : undefined,
      venda_id: vendaId ? Number(vendaId) : undefined,
    });
  }

  @Post('dar-entrada/manual')
  @Permissoes('produtos.editar')
  darEntradaManual(
    @Body()
    dto: {
      produto_id: number;
      quantidade_chapas: number;
      fornecedor_nome?: string;
      lote?: string;
      observacao?: string;
    },
  ) {
    return this.service.darEntradaManual(dto);
  }

  @Post('dar-entrada/nf')
  @Permissoes('produtos.editar')
  darEntradaNf(
    @Body()
    dto: {
      numero_nf: string;
      fornecedor_nome?: string;
      observacao?: string;
      itens: Array<{
        produto_id: number;
        quantidade_chapas: number;
        lote?: string;
        observacao?: string;
      }>;
    },
  ) {
    return this.service.darEntradaPorNf(dto);
  }

  @Post('reservar-venda/:vendaId')
  @Permissoes('vendas.editar', 'produtos.editar')
  reservarParaVenda(
    @Param('vendaId') vendaId: string,
    @Body()
    dto: {
      projeto_nome?: string;
      consumo?: ReservaConsumoDto[];
    },
  ) {
    return this.service.reservarParaVenda(Number(vendaId), dto);
  }
}
