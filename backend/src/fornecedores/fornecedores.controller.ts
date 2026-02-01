import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CreateFornecedorDto } from './dto/criar-fornecedor.dto'
import { UpdateFornecedorDto } from './dto/atualizar-fornecedor.dto'
import { FornecedorService } from './fornecedores.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('fornecedor')
export class FornecedorController {
  constructor(private readonly service: FornecedorService) {}

  @Get()
  @Permissoes('fornecedores.ver')
  listar() {
    return this.service.listar()
  }

@Get('select')
@Permissoes('fornecedores.select')
select(@Query('q') q?: string) {
  return this.service.select(q)
}

  @Get(':id')
  @Permissoes('fornecedores.ver')
  buscarPorId(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.buscarPorId(cleanId)
  }

  @Post()
  @Permissoes('fornecedores.criar')
  criar(@Body() dto: CreateFornecedorDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  @Permissoes('fornecedores.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateFornecedorDto) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.atualizar(cleanId, dto)
  }

  @Delete(':id')
  @Permissoes('fornecedores.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''))
    return this.service.remover(cleanId)
  }
}
