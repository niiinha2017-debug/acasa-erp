import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
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
      venda_id: venda_id ? Number(venda_id) : undefined,
      tipo_compra: tipo_compra || undefined,
    })
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(Number(id))
  }

  @Post()
  criar(@Body() dto: CriarCompraDto) {
    return this.service.criar(dto)
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarCompraDto) {
    return this.service.atualizar(Number(id), dto)
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id))
  }
}
