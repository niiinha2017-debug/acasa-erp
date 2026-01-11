import { 
  Body, 
  Controller, 
  Delete, 
  Get,
  Post, 
  Param, 
  Put,
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { ComprasService } from './compras.service'
import { CriarCompraDto } from './dto/criar-compra.dto'
import { AtualizarCompraDto } from './dto/atualizar-compra.dto'

@Controller('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  @Get()
  async listar(
    @Query('venda_id') venda_id?: string,
    @Query('tipo_compra') tipo_compra?: string,
  ) {
    return this.service.listar({
      venda_id: venda_id ? Number(venda_id.replace(/\D/g, '')) : undefined,
      tipo_compra: tipo_compra?.trim() || undefined,
    })
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(Number(id.replace(/\D/g, '')))
  }

  // ✅ CRIAÇÃO (POST)
@Post()
criar(@Body() dto: CriarCompraDto) {
  return this.service.criar(dto)
}


  // ✅ ATUALIZAÇÃO (PUT)
  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarCompraDto) {
    return this.service.atualizar(Number(id.replace(/\D/g, '')), dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id.replace(/\D/g, '')))
  }
}
