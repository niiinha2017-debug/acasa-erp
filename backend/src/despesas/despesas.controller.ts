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

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
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

  /** Lista despesas com funcionário vinculado (tela administrativa de pagamento). */
  @Get('funcionarios')
  @Permissoes('despesas.ver')
  listarComFuncionario(
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('status') status?: string,
    @Query('funcionario_id') funcionario_id?: string,
    @Query('categorias') categorias?: string,
  ) {
    const funcionarioIdNum = funcionario_id
      ? Number(String(funcionario_id).replace(/\D/g, ''))
      : undefined;
    const categoriasArr = categorias
      ? categorias.split(',').map((c) => c.trim()).filter(Boolean)
      : undefined;
    return this.service.listarComFuncionario({
      data_ini: data_ini?.trim() || undefined,
      data_fim: data_fim?.trim() || undefined,
      status: status?.trim() || undefined,
      funcionario_id: funcionarioIdNum || undefined,
      categorias: categoriasArr,
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

  /** Marca despesa como paga (tela de pagamento a funcionários). */
  @Post(':id/pagar')
  @Permissoes('despesas.editar')
  marcarComoPago(@Param('id') id: any) {
    const cleanId =
      typeof id === 'string' ? Number(id.replace(/\D/g, '')) : Number(id);
    return this.service.marcarComoPago(cleanId);
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
