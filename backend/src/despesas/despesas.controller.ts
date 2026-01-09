import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Put, // Padronizado para Put
  Post, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';

@Controller('despesas')
export class DespesasController {
  constructor(private readonly service: DespesasService) {}

  @Post()
  create(@Body() dto: CreateDespesaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Limpeza de ID padronizada para evitar erros de Pipe
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.findOne(cleanId);
  }

  @Put(':id') // Alterado de Patch para Put
  update(@Param('id') id: string, @Body() dto: UpdateDespesaDto) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.update(cleanId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna 204 após deletar
  remove(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.remove(cleanId);
  }
}