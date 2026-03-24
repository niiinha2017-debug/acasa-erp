import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Res,
  Query,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { FuncionariosService } from './funcionarios.service';
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto';
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto';
import { GerarPdfFuncionariosDto } from './dto/gerar-pdf-funcionarios.dto';
import { UpsertFuncionarioCustoConstanteDto } from './dto/upsert-funcionario-custo-constante.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Post('pdf')
  @Permissoes('funcionarios.ver')
  @HttpCode(HttpStatus.OK)
  async gerarPdfLote(
    @Body() dto: GerarPdfFuncionariosDto,
    @Query('formato') formato?: string,
  ) {
    return this.service.gerarRelatorioESalvar(dto.ids, formato); // retorna { arquivoId }
  }

  @Get('select')
  @Permissoes('funcionarios.select')
  select(@Query('q') q?: string, @Query('unidade') unidade?: string) {
    return this.service.select(q, unidade);
  }

  @Get()
  @Permissoes('funcionarios.ver')
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  @Permissoes('funcionarios.ver')
  buscarPorId(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.buscarPorId(Number(cleanId));
  }

  @Get(':id/custos-constantes')
  @Permissoes('funcionarios.ver')
  buscarCustosConstantes(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.obterConstanteCusto(Number(cleanId));
  }

  @Post()
  @Permissoes('funcionarios.criar')
  criar(@Body() dto: CriarFuncionarioDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  @Permissoes('funcionarios.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarFuncionarioDto) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.atualizar(Number(cleanId), dto);
  }

  @Put(':id/custos-constantes')
  @Permissoes('funcionarios.editar')
  atualizarCustosConstantes(
    @Param('id') id: string,
    @Body() dto: UpsertFuncionarioCustoConstanteDto,
  ) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.upsertConstanteCusto(Number(cleanId), dto);
  }

  @Delete(':id')
  @Permissoes('funcionarios.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.remover(Number(cleanId));
  }
}
