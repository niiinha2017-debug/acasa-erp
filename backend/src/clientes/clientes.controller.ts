import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Put, // Alterado para Put
  Post, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
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

  // IMPORTANTE: Rotas de relatórios devem vir ANTES de rotas com :id
  // para evitar que o NestJS ache que "relatorios" é um ID numérico.
  @Get('relatorios/aniversariantes')
  aniversariantes(
    @Query('data') data?: string,
    @Query('enviar') enviar?: 'email' | 'whatsapp',
  ) {
    const hoje = new Date().toISOString().slice(0, 10)
    return this.service.aniversariantesDoDia(data ?? hoje, enviar)
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    // Limpeza de ID padronizada
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.buscarPorId(cleanId)
  }

  @Put(':id') // Mudou de Patch para Put
  atualizar(@Param('id') id: string, @Body() dto: AtualizarClienteDto) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.atualizar(cleanId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 após deletar (Padrão REST)
  remover(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.remover(cleanId)
  }
}