import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DespesasService } from './despesas.service';
import { CreateDespesaDto } from './dto/create-despesa.dto';
import { UpdateDespesaDto } from './dto/update-despesa.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('despesas')
export class DespesasController {
  constructor(private readonly service: DespesasService) {}

  @Get()
  @Permissoes('despesas.ver')
  findAll(
    @Query('status') status?: string,
    @Query('unidade') unidade?: string,
    @Query('tipo_movimento') tipo_movimento?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return this.service.findAll({
      status: status?.trim() || undefined,
      unidade: unidade?.trim() || undefined,
      tipo_movimento: tipo_movimento?.trim() || undefined,
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
    });
  }

  @Get(':id')
  @Permissoes('despesas.ver')
  findOne(@Param('id') id: string) {
    const cleanId = Number(id.replace(/\D/g, ''));
    return this.service.findOne(cleanId);
  }

  @Post()
  @Permissoes('despesas.criar')
  create(@Body() dto: CreateDespesaDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Permissoes('despesas.editar')
  update(@Param('id') id: any, @Body() dto: UpdateDespesaDto) {
    const cleanId =
      typeof id === 'string' ? Number(id.replace(/\D/g, '')) : Number(id);
    return this.service.update(cleanId, dto);
  }

  @Delete(':id')
  @Permissoes('despesas.excluir')
  remove(@Param('id') id: any) {
    // Mude para any para evitar erro de string/number
    const cleanId =
      typeof id === 'string' ? Number(id.replace(/\D/g, '')) : Number(id);
    return this.service.remove(cleanId);
  }
}
