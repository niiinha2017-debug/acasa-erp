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
  Req,
  UseGuards,
} from '@nestjs/common';

import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/criar-produto.dto';
import { UpdateProdutoDto } from './dto/atualizar-produto.dto';
import { BuscarProdutoDto } from './dto/buscar-produto.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  private normTag(v: any): string {
    return String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private aplicarMarkup100(user: any): boolean {
    if (!user || user.is_admin) return false;

    const setor = this.normTag(user?.funcionario?.setor);
    const unidade = this.normTag(user?.funcionario?.unidade);
    return setor === 'LOJA' || unidade === 'LOJA';
  }

  @Get('buscar/filtros')
  @Permissoes('produtos.ver')
  buscar(@Query() dto: BuscarProdutoDto, @Req() req: any) {
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

    return this.produtosService.buscar(payload, {
      aplicarMarkup100: this.aplicarMarkup100(req.user),
    });
  }

  @Get('abaixo-estoque-minimo')
  @Permissoes('produtos.ver')
  listarAbaixoEstoqueMinimo(@Req() req?: any) {
    return this.produtosService.listarAbaixoEstoqueMinimo({
      aplicarMarkup100: this.aplicarMarkup100(req?.user),
    });
  }

  @Get()
  @Permissoes('produtos.ver')
  listar(
    @Query('fornecedor_id') fornecedor_id?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Req() req?: any,
  ) {
    const fId = fornecedor_id
      ? Number(String(fornecedor_id).replace(/\D/g, ''))
      : undefined;
    const aplicarMarkup100 = this.aplicarMarkup100(req?.user);

    if (page) {
      return this.produtosService.listar(
        { fornecedor_id: fId },
        { page: Number(page), pageSize: Number(pageSize || 20) },
        { aplicarMarkup100 },
      );
    }

    return this.produtosService.listar({ fornecedor_id: fId }, undefined, {
      aplicarMarkup100,
    });
  }

  @Get(':id')
  @Permissoes('produtos.ver')
  buscarPorId(@Param('id') id: string, @Req() req: any) {
    const cleanId = Number(String(id).replace(/\D/g, ''));
    return this.produtosService.buscarPorId(cleanId, {
      aplicarMarkup100: this.aplicarMarkup100(req.user),
    });
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
