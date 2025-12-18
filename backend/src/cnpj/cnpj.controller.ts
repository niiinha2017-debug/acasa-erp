import { Controller, Get, Query } from '@nestjs/common'
import { CnpjService } from './cnpj.service'

@Controller('cnpj')
export class CnpjController {
  constructor(private readonly cnpjService: CnpjService) {}

  @Get()
  buscar(@Query('cnpj') cnpj: string) {
    return this.cnpjService.buscarCnpj(cnpj)
  }
}
