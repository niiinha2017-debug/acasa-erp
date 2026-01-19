// src/modulos/empresa/empresa.controller.ts
import { Controller, Get, Put, Body } from '@nestjs/common'
import { EmpresaService } from './empresa.service'

@Controller('configuracoes/empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  buscar() {
    return this.empresaService.buscar()
  }

  @Put()
  salvar(@Body() dados: any) {
    return this.empresaService.salvar(dados)
  }
}
