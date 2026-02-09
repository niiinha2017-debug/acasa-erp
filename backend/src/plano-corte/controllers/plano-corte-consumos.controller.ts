import {
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
  UseGuards,
} from '@nestjs/common';
import { PlanoCorteConsumosService } from '../service/plano-corte-consumos.service';
import { CreatePlanoCorteConsumoDto } from '../dto/create-plano-corte-consumo.dto';
import { UpdatePlanoCorteConsumoDto } from '../dto/update-plano-corte-consumo.dto';
import { BuscarProdutoDto } from '../../produtos/dto/buscar-produto.dto';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissoes } from '../../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plano-corte-consumos')
export class PlanoCorteConsumosController {
  constructor(private readonly service: PlanoCorteConsumosService) {}

  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Post()
  @Permissoes('plano_corte.criar')
  criar(@Body() dto: CreatePlanoCorteConsumoDto) {
    return this.service.criar(dto);
  }

  @Get()
  @Permissoes('plano_corte.ver')
  listar(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    if (page) {
      return this.service.listar({
        page: Number(page),
        pageSize: Number(pageSize || 20),
      });
    }
    return this.service.listar();
  }

  @Get('buscar/produtos')
  @Permissoes('plano_corte.ver')
  buscarProdutos(@Query() dto: BuscarProdutoDto) {
    const fornecedor_id = dto.fornecedor_id
      ? Number(String(dto.fornecedor_id).replace(/\D/g, ''))
      : undefined;

    return this.service.buscarProdutosParaConsumo({
      nome_produto: dto.nome_produto?.trim(),
      marca: dto.marca?.trim(),
      cor: dto.cor?.trim(),
      medida: dto.medida?.trim(),
      fornecedor_id,
    });
  }

  @Get(':id')
  @Permissoes('plano_corte.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscar(this.cleanId(id));
  }

  @Put(':id')
  @Permissoes('plano_corte.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdatePlanoCorteConsumoDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Delete(':id')
  @Permissoes('plano_corte.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }
}
