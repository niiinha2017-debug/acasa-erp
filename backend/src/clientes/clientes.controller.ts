import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ClientesService } from './clientes.service'
import { CriarClienteDto } from './dto/criar-cliente.dto'
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto'

@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  criar(@Body() dto: CriarClienteDto) {
    return this.service.criar(dto)
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(Number(id))
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarClienteDto) {
    return this.service.atualizar(Number(id), dto)
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id))
  }

  // Ex.: /clientes/aniversariantes?data=2026-01-05&enviar=email
  @Get('relatorios/aniversariantes')
  aniversariantes(
    @Query('data') data?: string,
    @Query('enviar') enviar?: 'email' | 'whatsapp',
  ) {
    const hoje = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return this.service.aniversariantesDoDia(data ?? hoje, enviar)
  }
}
