import { Controller, Get, Param, Res } from '@nestjs/common'
import type { Response } from 'express'
import { OrcamentosService } from './orcamentos.service'

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly service: OrcamentosService) {}

  @Get(':id/pdf')
  pdf(@Param('id') id: string, @Res() res: Response) {
    return this.service.gerarPdfTemplate(+id, res)
  }
}
