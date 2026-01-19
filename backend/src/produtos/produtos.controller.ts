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
} from '@nestjs/common'
import { ProdutosService } from './produtos.service'
import { CreateProdutoDto } from './dto/criar-produto.dto'
import { UpdateProdutoDto } from './dto/atualizar-produto.dto'

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  listar(@Query('fornecedor_id') fornecedor_id?: string) {
    const fId = fornecedor_id ? Number(String(fornecedor_id).replace(/\D/g, '')) : undefined
    return this.produtosService.listar({ fornecedor_id: fId })
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.produtosService.buscarPorId(cleanId)
  }

  @Post()
  criar(@Body() dto: CreateProdutoDto) {
    return this.produtosService.criar(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.produtosService.atualizar(cleanId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.produtosService.remover(cleanId)
  }
}
