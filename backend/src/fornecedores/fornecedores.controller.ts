import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateFornecedorDto } from './dto/criar-fornecedor.dto'
import { UpdateFornecedorDto } from './dto/atualizar-fornecedor.dto'
import { FornecedoresService } from './fornecedores.service';

@Controller('fornecedores')
export class FornecedoresController {
  constructor(private readonly service: FornecedoresService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(Number(id));
  }

  @Post()
  criar(@Body() dto: CreateFornecedorDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateFornecedorDto) {
    return this.service.atualizar(Number(id), dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id));
  }
}
