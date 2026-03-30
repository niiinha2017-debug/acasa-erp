// src/modulos/empresa/empresa.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { EmpresaService } from './empresa.service';

import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';

@UseGuards(PermissionsGuard)
@Controller('configuracoes/empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post('whatsapp-test')
  @Permissoes('configuracoes.empresa.ver')
  whatsappTest(@Body() dados?: any) {
    return this.empresaService.testarEvolutionApi(dados);
  }

  @Post('evolution-test')
  @Permissoes('configuracoes.empresa.ver')
  evolutionTest(@Body() dados?: any) {
    return this.empresaService.testarEvolutionApi(dados);
  }

  @Get()
  @Permissoes('configuracoes.empresa.ver')
  buscar() {
    return this.empresaService.buscar();
  }

  @Put()
  @Permissoes('configuracoes.empresa.editar')
  salvar(@Body() dados: any) {
    return this.empresaService.salvar(dados);
  }
}
