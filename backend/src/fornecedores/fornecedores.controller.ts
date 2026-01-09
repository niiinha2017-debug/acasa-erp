import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Put, // Alterado: PUT para o formulário de edição
  Post, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
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
    // Blindagem de ID: removendo caracteres não numéricos
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.buscarPorId(cleanId);
  }

  @Post()
  criar(@Body() dto: CreateFornecedorDto) {
    return this.service.criar(dto);
  }

  @Put(':id') // Padronizado: PUT em vez de PATCH
  atualizar(@Param('id') id: string, @Body() dto: UpdateFornecedorDto) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.atualizar(cleanId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 após deletar
  remover(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.remover(cleanId);
  }
}