import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put, // Alterado para Put para combinar com o Front-end
  Post,
  UseGuards,
} from '@nestjs/common'
import { FuncionariosService } from './funcionarios.service'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    // Tratamento para garantir que o ID seja apenas números (remove ":" indesejados)
    const cleanId = id.replace(/\D/g, '') 
    return this.service.buscarPorId(Number(cleanId))
  }

  @Post()
  criar(@Body() dto: CriarFuncionarioDto) {
    return this.service.criar(dto)
  }

  // Alterado de @Patch para @Put para aceitar o api.put do seu Front-end
  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarFuncionarioDto) {
    const cleanId = id.replace(/\D/g, '')
    return this.service.atualizar(Number(cleanId), dto)
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '')
    return this.service.remover(Number(cleanId))
  }
}