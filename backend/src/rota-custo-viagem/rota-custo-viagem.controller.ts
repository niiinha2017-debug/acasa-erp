import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import {
  RotaCustoViagemService,
  CreateRotaDto,
  RelatorioRotaFiltros,
} from './rota-custo-viagem.service';

@UseGuards(PermissionsGuard)
@Controller('rota-custo-viagem')
export class RotaCustoViagemController {
  constructor(private readonly service: RotaCustoViagemService) {}

  // Lista todas as rotas (com filtros opcionais)
  @Get()
  @Permissoes('relatorios.custo_rota')
  findAll(
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('funcionario_id') funcionario_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('automovel_id') automovel_id?: string,
  ) {
    const filtros: RelatorioRotaFiltros = {
      data_inicio: dataInicio,
      data_fim: dataFim,
      funcionario_id: funcionario_id ? parseInt(funcionario_id) : undefined,
      cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
      automovel_id: automovel_id ? parseInt(automovel_id) : undefined,
    };
    return this.service.findAll(filtros);
  }

  // Relatório consolidado (totais + por funcionário)
  @Get('relatorio')
  @Permissoes('relatorios.custo_rota')
  relatorio(
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('funcionario_id') funcionario_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('automovel_id') automovel_id?: string,
  ) {
    const filtros: RelatorioRotaFiltros = {
      data_inicio: dataInicio,
      data_fim: dataFim,
      funcionario_id: funcionario_id ? parseInt(funcionario_id) : undefined,
      cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
      automovel_id: automovel_id ? parseInt(automovel_id) : undefined,
    };
    return this.service.relatorio(filtros);
  }

  @Get(':id')
  @Permissoes('relatorios.custo_rota')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissoes('agendamentos.producao')
  create(@Body() body: CreateRotaDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Permissoes('agendamentos.producao')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateRotaDto>) {
    return this.service.update(id, body);
  }
}
