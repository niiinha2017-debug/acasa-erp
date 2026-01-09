// src/orcamentos/orcamentos.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import PDFDocument from 'pdfkit'
import { PDFDocument as PDFLib } from 'pdf-lib'
import { promises as fs } from 'fs'
import * as path from 'path'

import { OrcamentosService } from './orcamentos.service'
import { CreateOrcamentoDto } from './dto/create-orcamento.dto'
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto'
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto'
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto'

function permitirTiposBasicos(file: any) {
  const tipos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  return tipos.includes(file?.mimetype)
}

// Gera o "miolo" (páginas com dados do orçamento) em Buffer via pdfkit
async function gerarMioloPdfBuffer(orc: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    // Título
    doc.fontSize(16).text('ORÇAMENTO', { align: 'center' })
    doc.moveDown(1)

    // Snapshot fixo
    doc.fontSize(11).text(`Cliente: ${orc.cliente_nome_snapshot}`)
    doc.text(`CPF: ${orc.cliente_cpf_snapshot || '-'}`)
    doc.moveDown(1)

    // Dados ao vivo do cadastro (como você decidiu)
    doc.fontSize(11).text('Dados do cliente (cadastro):')
    doc.fontSize(10).text(`Telefone: ${orc.cliente?.telefone || '-'}`)
    doc.text(`WhatsApp: ${orc.cliente?.whatsapp || '-'}`)
    doc.text(`Email: ${orc.cliente?.email || '-'}`)
    doc.text(
      `Endereço: ${[
        orc.cliente?.endereco,
        orc.cliente?.numero,
        orc.cliente?.bairro,
        orc.cliente?.cidade,
        orc.cliente?.estado,
      ]
        .filter(Boolean)
        .join(', ') || '-'}`,
    )
    doc.moveDown(1)

    // Itens
    doc.fontSize(12).text('Itens do orçamento', { underline: true })
    doc.moveDown(0.5)

    let total = 0

    for (const item of orc.itens || []) {
      const vt = Number(item.valor_total || 0)
      const vu = Number(item.valor_unitario || 0)
      total += vt

      doc.fontSize(10).text(`Ambiente: ${item.nome_ambiente}`)
      doc.text(`Descrição: ${item.descricao}`)
      doc.text(`Valor unitário: R$ ${vu.toFixed(2)}`)
      doc.text(`Valor total:   R$ ${vt.toFixed(2)}`)
      doc.moveDown(0.8)

      // quebra de página se ficar muito grande
      if (doc.y > 740) doc.addPage()
    }

    doc.moveDown(0.8)
    doc.fontSize(12).text(`Total do orçamento: R$ ${total.toFixed(2)}`)

    doc.end()
  })
}

// Mescla CAPA + MIOLO + PÁGINA FINAL (rodapé) via pdf-lib
async function mesclarCapaMioloRodape(miolo: Buffer): Promise<Uint8Array> {
  // seus PDFs estão em backend/assets/pdf/...
  const capaPath = path.resolve(process.cwd(), 'assets', 'pdf', 'Logo Orçamento.pdf')
  const rodapePath = path.resolve(
    process.cwd(),
    'assets',
    'pdf',
    'Paginas Seguintes.pdf',
  )

  const [capaBytes, rodapeBytes] = await Promise.all([
    fs.readFile(capaPath),
    fs.readFile(rodapePath),
  ])

  const out = await PDFLib.create()

  const capa = await PDFLib.load(capaBytes)
  const mioloDoc = await PDFLib.load(miolo)
  const rodape = await PDFLib.load(rodapeBytes)

  const capaPages = await out.copyPages(capa, capa.getPageIndices())
  capaPages.forEach((p) => out.addPage(p))

  const mioloPages = await out.copyPages(mioloDoc, mioloDoc.getPageIndices())
  mioloPages.forEach((p) => out.addPage(p))

  const rodapePages = await out.copyPages(rodape, rodape.getPageIndices())
  rodapePages.forEach((p) => out.addPage(p))

  return out.save()
}

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly service: OrcamentosService) {}

  // ---------------- ORÇAMENTO ----------------
  @Post()
  criar(@Body() dto: CreateOrcamentoDto) {
    return this.service.criar(dto)
  }

  @Get()
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  detalhar(@Param('id') id: string) {
    return this.service.detalhar(Number(id))
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateOrcamentoDto) {
    return this.service.atualizar(Number(id), dto)
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(Number(id))
  }

  // ---------------- ITENS ----------------
  @Post(':id/itens')
  adicionarItem(@Param('id') id: string, @Body() dto: CreateOrcamentoItemDto) {
    return this.service.adicionarItem(Number(id), dto)
  }

  @Patch(':id/itens/:itemId')
  atualizarItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrcamentoItemDto,
  ) {
    return this.service.atualizarItem(Number(id), Number(itemId), dto)
  }

  @Delete(':id/itens/:itemId')
  removerItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removerItem(Number(id), Number(itemId))
  }

  // ---------------- ARQUIVOS ----------------
  @Post(':id/arquivos')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!permitirTiposBasicos(file)) {
          return cb(new BadRequestException('Tipo de arquivo não permitido.'), false)
        }
        cb(null, true)
      },
    }),
  )
  anexarArquivo(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.service.anexarArquivo(Number(id), file)
  }

  @Get(':id/arquivos')
  listarArquivos(@Param('id') id: string) {
    return this.service.listarArquivos(Number(id))
  }

  @Get(':id/arquivos/:arquivoId/abrir')
  async abrirArquivo(
    @Param('id') id: string,
    @Param('arquivoId') arquivoId: string,
    @Res() res: Response,
  ) {
    const { arq, abs } = await this.service.obterArquivo(Number(id), Number(arquivoId))

    res.setHeader('Content-Type', arq.mime_type || 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(arq.nome_original)}"`,
    )

    return res.sendFile(abs)
  }

  @Delete(':id/arquivos/:arquivoId')
  removerArquivo(
    @Param('id') id: string,
    @Param('arquivoId') arquivoId: string,
  ) {
    return this.service.removerArquivo(Number(id), Number(arquivoId))
  }

  // ---------------- PDF (CAPA + MIOLO + PÁGINA FINAL) ----------------
  @Get(':id/pdf')
  async gerarPdf(@Param('id') id: string, @Res() res: Response) {
    const orc = await this.service.detalhar(Number(id))

    const miolo = await gerarMioloPdfBuffer(orc)
    const pdfFinal = await mesclarCapaMioloRodape(miolo)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="orcamento-${orc.id}.pdf"`)
    return res.end(Buffer.from(pdfFinal))
  }
}
