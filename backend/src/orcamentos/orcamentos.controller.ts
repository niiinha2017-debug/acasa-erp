import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'

import { OrcamentosService } from './orcamentos.service'
import { CreateOrcamentoDto } from './dto/create-orcamento.dto'
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto'
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto'
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto'

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly service: OrcamentosService) {}

  private cleanId(id: string): number {
    const n = Number(String(id || '').replace(/\D/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  detalhar(@Param('id') id: string) {
    return this.service.detalhar(this.cleanId(id))
  }

  @Post()
  criar(@Body() dto: CreateOrcamentoDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateOrcamentoDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }

  // =========================
  // ITENS
  // =========================

  @Post(':id/itens')
  adicionarItem(@Param('id') id: string, @Body() dto: CreateOrcamentoItemDto) {
    return this.service.adicionarItem(this.cleanId(id), dto)
  }

  @Put(':id/itens/:itemId')
  atualizarItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrcamentoItemDto,
  ) {
    return this.service.atualizarItem(this.cleanId(id), this.cleanId(itemId), dto)
  }

  @Delete(':id/itens/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removerItem(this.cleanId(id), this.cleanId(itemId))
  }

  // =========================
  // ARQUIVOS
  // =========================

  @Post(':id/arquivos')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  anexarArquivo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório.')
    return this.service.anexarArquivo(this.cleanId(id), file)
  }

  @Get(':id/arquivos')
  listarArquivos(@Param('id') id: string) {
    return this.service.listarArquivos(this.cleanId(id))
  }

  @Get(':id/arquivos/:arquivoId')
  async abrirArquivo(
    @Param('id') id: string,
    @Param('arquivoId') arquivoId: string,
    @Res() res: Response,
  ) {
    const orcId = this.cleanId(id)
    const arqId = this.cleanId(arquivoId)

    const { arq, abs } = await this.service.obterArquivo(orcId, arqId)

    res.setHeader('Content-Type', arq.mime_type)
    res.setHeader('Content-Disposition', `inline; filename="${arq.nome_original}"`)
    return res.sendFile(abs)
  }

  @Delete(':id/arquivos/:arquivoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerArquivo(@Param('id') id: string, @Param('arquivoId') arquivoId: string) {
    return this.service.removerArquivo(this.cleanId(id), this.cleanId(arquivoId))
  }

  // =========================
  // PDF
  // =========================

  @Get(':id/pdf')
  async gerarPdf(@Param('id') id: string, @Res() res: Response) {
    const orcId = this.cleanId(id)
    const orc = await this.service.detalhar(orcId)

    const pdfFinal = await this.service.gerarPdfCompleto(orc)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="orcamento-${orcId}.pdf"`)
    return res.end(Buffer.from(pdfFinal))
  }
}
