import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SolicitacoesService } from './solicitacoes.service';
import { CreateSolicitacoeDto } from './dto/create-solicitacoe.dto';
import { UpdateSolicitacoeDto } from './dto/update-solicitacoe.dto';

@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(private readonly solicitacoesService: SolicitacoesService) {}

  @Post()
  create(@Body() createSolicitacoeDto: CreateSolicitacoeDto) {
    return this.solicitacoesService.create(createSolicitacoeDto);
  }

  @Get()
  findAll() {
    return this.solicitacoesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicitacoesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSolicitacoeDto: UpdateSolicitacoeDto) {
    return this.solicitacoesService.update(+id, updateSolicitacoeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.solicitacoesService.remove(+id);
  }
}
