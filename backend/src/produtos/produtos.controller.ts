import { 
  Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus 
} from '@nestjs/common'
import { ProdutosService } from './produtos.service'
import { CreateProdutoDto } from './dto/criar-produto.dto'
import { UpdateProdutoDto } from './dto/atualizar-produto.dto'

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  /**
   * Função de limpeza de IDs - O coração da nossa blindagem
   */
  private cleanId(id: string | number): number {
    return Number(String(id).replace(/\D/g, ''));
  }

  @Post()
  criar(@Body() dto: CreateProdutoDto) {
    return this.service.criar(dto);
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    // Substituímos o ParseIntPipe pelo cleanId para maior resiliência
    return this.service.buscarPorId(this.cleanId(id));
  }

  @Put(':id') // Padronizado para PUT (Edição completa do produto)
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoDto,
  ) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorno 204 para remoções
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }
}