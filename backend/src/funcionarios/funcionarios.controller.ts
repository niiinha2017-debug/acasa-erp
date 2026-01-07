import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
    return this.service.buscarPorId(Number(id))
  }

  @Post()
  criar(@Body() dto: CriarFuncionarioDto) {
    return this.service.criar(dto)
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarFuncionarioDto) {
    return this.service.atualizar(Number(id), dto)
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id))
  }
}
