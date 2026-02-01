import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common'
import { ObrasService } from './obras.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

@Post()
@Permissoes('obras.criar')
async criar(@Body() body: any) {
  return this.obrasService.criarObra(body)
}

@Get('cliente/:clienteId')
@Permissoes('obras.ver')
async listarPorCliente(@Param('clienteId', ParseIntPipe) clienteId: number) {
  return this.obrasService.buscarPorCliente(clienteId)
}

@Get(':id')
@Permissoes('obras.ver')
async buscarPorId(@Param('id', ParseIntPipe) id: number) {
  return this.obrasService.buscarPorId(id)
}

@Put(':id')
@Permissoes('obras.editar')
async atualizar(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
  return this.obrasService.atualizar(id, body)
}

}
