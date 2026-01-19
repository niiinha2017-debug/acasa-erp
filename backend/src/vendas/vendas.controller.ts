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
} from '@nestjs/common'
import { VendasService } from './vendas.service'
import { CreateVendaDto } from './dto/create-venda.dto'
import { UpdateVendaDto } from './dto/update-venda.dto'
import { UpdateVendaStatusDto } from './dto/update-venda-status.dto'

@Controller('vendas')
export class VendasController {
  constructor(private readonly service: VendasService) {}

  private cleanId(id: string | number): number {
    const n = Number(String(id || '').replace(/\D/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id))
  }

  @Post()
  criar(@Body() dto: CreateVendaDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateVendaDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Put(':id/status')
  atualizarStatus(@Param('id') id: string, @Body() dto: UpdateVendaStatusDto) {
    return this.service.atualizarStatus(this.cleanId(id), dto.status)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }
}
