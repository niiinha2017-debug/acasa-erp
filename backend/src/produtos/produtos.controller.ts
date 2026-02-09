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

import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/criar-produto.dto';
import { UpdateProdutoDto } from './dto/atualizar-produto.dto';
import { BuscarProdutoDto } from './dto/buscar-produto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get('buscar/filtros')
  @Permissoes('produtos.ver')
  buscar(@Query() dto: BuscarProdutoDto) {
    const fornecedor_id = dto.fornecedor_id
      ? Number(String(dto.fornecedor_id).replace(/\D/g, ''))
      : undefined;

    const payload: any = {
      nome_produto: dto.nome_produto?.trim(),
      marca: dto.marca?.trim(),
      cor: dto.cor?.trim(),
      medida: dto.medida?.trim(),
      fornecedor_id,
    };

    // suporta paginação
    const qp: any = dto as any;
    if (qp.page) payload.page = Number(qp.page);
    if (qp.pageSize) payload.pageSize = Number(qp.pageSize);

    return this.produtosService.buscar(payload);
  }

  @Get()
  @Permissoes('produtos.ver')
  listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const fId = fornecedor_id
      ? Number(String(fornecedor_id).replace(/\D/g, ''))
      : undefined;

    if (page) {
      return this.produtosService.listar(
        { fornecedor_id: fId },
        { page: Number(page), pageSize: Number(pageSize || 20) },
      );
    }

    return this.produtosService.listar({ fornecedor_id: fId });
  }

  @Get(':id')
  @Permissoes('produtos.ver')
  buscarPorId(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.produtosService.buscarPorId(cleanId);
  }

  @Post()
  @Permissoes('produtos.criar')
  criar(@Body() dto: CreateProdutoDto) {
    return this.produtosService.criar(dto);
  }

  @Put(':id')
  @Permissoes('produtos.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.produtosService.atualizar(cleanId, dto);
  }

  @Delete(':id')
  @Permissoes('produtos.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.produtosService.remover(cleanId);
  }
}
