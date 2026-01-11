import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common'
import { ProdutosService } from './produtos.service'
import { CreateProdutoDto } from './dto/criar-produto.dto'
import { UpdateProdutoDto } from './dto/atualizar-produto.dto'

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  listar() {
    return this.produtosService.listar()
  }

  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.buscarPorId(id)
  }

  // ✅ PADRÃO: POST cria
  @Post()
  criar(@Body() dto: CreateProdutoDto) {
    return this.produtosService.criar(dto)
  }

  // ✅ PADRÃO: PUT atualiza
  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProdutoDto) {
    return this.produtosService.atualizar(id, dto)
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remover(id)
  }
}
