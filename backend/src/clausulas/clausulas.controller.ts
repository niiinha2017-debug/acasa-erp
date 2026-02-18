import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';

import { ClausulasService, UpdateClausulasDto } from './clausulas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clausulas')
export class ClausulasController {
  constructor(private readonly service: ClausulasService) {}

  /**
   * Busca (ou cria em branco) o modelo de cláusulas
   * para ORCAMENTO ou CONTRATO.
   */
  @Get(':tipo')
  @Permissoes('orcamentos.editar')
  buscar(@Param('tipo') tipo: string) {
    return this.service.buscarOuCriarPorTipo(tipo);
  }

  /**
   * Salva o texto das cláusulas para ORCAMENTO ou CONTRATO.
   */
  @Put(':tipo')
  @Permissoes('orcamentos.editar')
  salvar(
    @Param('tipo') tipo: string,
    @Body() dto: UpdateClausulasDto,
  ) {
    return this.service.salvarPorTipo(tipo, dto);
  }
}

