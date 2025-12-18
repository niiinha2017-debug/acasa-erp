import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Res, // ✅ faltava
} from '@nestjs/common'
import type { Response } from 'express' // ✅ type-only
import { FuncionariosService } from './funcionarios.service'

@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id))
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(Number(id), body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @Post('pdf')
  async gerarPdf(@Body() body: { ids: number[] }, @Res() res: Response) {
    const pdfBuffer = await this.service.gerarPdfPortaria(body.ids)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename=funcionarios-portaria.pdf')
    res.setHeader('Content-Length', String(pdfBuffer.length))

    return res.end(pdfBuffer)
  }
}
