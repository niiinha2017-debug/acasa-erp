import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'
import { VendasService } from './vendas.service'
import { CreateVendaDto } from './dto/create-venda.dto'
import { UpdateVendaDto } from './dto/update-venda.dto'

// Se no seu projeto vendas é protegido por JWT como o resto, descomenta:
// import { UseGuards } from '@nestjs/common'
// import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'

@Controller('vendas')
export class VendasController {
  constructor(private readonly service: VendasService) {}

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id)
  }

  @Post()
  criar(@Body() dto: CreateVendaDto) {
    return this.service.criar(dto)
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendaDto,
  ) {
    return this.service.atualizar(id, dto)
  }

  @Patch(':id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.service.atualizarStatus(id, body.status)
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id)
  }
}
