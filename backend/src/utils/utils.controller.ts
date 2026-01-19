import { Controller, Get, Param } from '@nestjs/common'
import { UtilsService } from './utils.service'

@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  @Get('cnpj/:cnpj')
  buscarCnpj(@Param('cnpj') cnpj: string) {
    return this.utilsService.buscarCnpj(cnpj)
  }
}
