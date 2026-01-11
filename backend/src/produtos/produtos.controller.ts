import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ProdutosService } from './produtos.service'
import { CreateProdutoDto } from './dto/criar-produto.dto'
import { UpdateProdutoDto } from './dto/atualizar-produto.dto'

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  listar(@Query('fornecedor_id') fornecedor_id?: string) {
    return this.produtosService.listar({
      fornecedor_id: fornecedor_id ? Number(fornecedor_id) : undefined,
    })
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.produtosService.buscarPorId(Number(id))
  }

  @Post()
  criar(@Body() dto: CreateProdutoDto) {
    return this.produtosService.criar(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.produtosService.atualizar(Number(id), dto)
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.produtosService.remover(Number(id))
  }
}
