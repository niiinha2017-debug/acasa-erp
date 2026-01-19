import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common'
import { ObrasService } from './obras.service'

@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  // =====================================================
  // CRIAR OBRA (início do processo do cliente)
  // =====================================================
  @Post()
  async criar(@Body() body: any) {
    return this.obrasService.criarObra(body)
  }

  // =====================================================
  // BUSCAR OBRA POR ID
  // =====================================================
  @Get(':id')
  async buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.obrasService.buscarPorId(id)
  }

  // =====================================================
  // LISTAR OBRAS DE UM CLIENTE
  // =====================================================
  @Get('cliente/:clienteId')
  async listarPorCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
  ) {
    return this.obrasService.buscarPorCliente(clienteId)
  }

  // =====================================================
  // ATUALIZAR DATAS / STATUS DO PROCESSO
  // (agendamentos: medida, orçamento, produção, etc.)
  // =====================================================
  @Put(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.obrasService.atualizar(id, body)
  }
}
