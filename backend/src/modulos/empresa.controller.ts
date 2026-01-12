// src/modulos/empresa/empresa.controller.ts
import { Controller, Get, Put, Body } from '@nestjs/common';
import { EmpresaService } from './empresa.service';

@Controller('configuracoes')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get('1')
  buscar() {
    return this.empresaService.buscar();
  }

  @Put('1')
  salvar(@Body() dados: any) {
    return this.empresaService.salvar(dados);
  }
}