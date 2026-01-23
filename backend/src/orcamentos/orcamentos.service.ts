import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrcamentoDto } from './dto/create-orcamento.dto'
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto'
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto'
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto'
import { promises as fs } from 'fs'
import * as path from 'path'
import { renderHeaderA4 } from 'src/pdf/render-header-a4'
import { resolveAsset } from 'src/pdf/render-header-a4' // só se você exportou resolveAsset


// Fixando o import para evitar conflitos com o DOM
import PDFKitDoc from 'pdfkit'

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // PDF
  // =========================================================
async gerarPdfCompleto(orc: any): Promise<Uint8Array> {
  const pdf = await this.gerarMioloPdfBuffer(orc)
  return pdf
}

private async gerarMioloPdfBuffer(orc: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFKitDoc({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    const capaPath = resolveAsset(path.join('assets', 'pdf', 'capa-a4.png'))

    // 1) CAPA
    doc.image(capaPath, 0, 0, { width: doc.page.width, height: doc.page.height })

    // 2) Conteúdo
    doc.addPage()

    const aplicarHeader = () => {
      const startY = renderHeaderA4(doc, 'ORÇAMENTO')
      doc.y = startY
      doc.moveDown(0.5)
    }

    aplicarHeader()
    doc.on('pageAdded', aplicarHeader)

    let total = 0

    for (const item of orc.itens || []) {
      const vt = Number(item.valor_total || 0)
      total += vt

      doc.fontSize(10).text(`Ambiente: ${item.nome_ambiente}`)

      doc.text('Descrição:')
      const linhas = String(item.descricao || '')
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*[*•\-\u2013\u2014]+\s*/g, '').trim())
        .filter(Boolean)

      if (linhas.length) {
        for (const t of linhas) doc.text(`• ${t}`, { indent: 14 })
      } else {
        doc.text('-', { indent: 14 })
      }

      doc.text(`Observação: ${item.observacao || '-'}`)
      doc.text(`Valor unitário: R$ ${Number(item.valor_unitario || 0).toFixed(2)}`)
      doc.text(`Valor total: R$ ${vt.toFixed(2)}`)
      doc.moveDown(0.8)

      if (doc.y > 700) doc.addPage()
    }

    doc.moveDown(1)
    doc.font('Helvetica-Bold').fontSize(12).text(`Total do orçamento: R$ ${total.toFixed(2)}`)
    doc.font('Helvetica')

    doc.end()
  })
}


  // =========================================================
  // CRUD - ORÇAMENTOS
  // =========================================================
  async criar(dto: CreateOrcamentoDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
    })
    if (!cliente) throw new NotFoundException('Cliente não encontrado.')

    return this.prisma.orcamentos.create({
      data: {
        cliente_id: cliente.id,
        cliente_nome_snapshot: cliente.nome_completo,
        cliente_cpf_snapshot: cliente.cpf || '',
        qtd_ambientes: 0,
      },
      include: { cliente: true, itens: true, arquivos: true },
    })
  }

  async listar() {
    const lista = await this.prisma.orcamentos.findMany({
      orderBy: { id: 'desc' },
      include: { cliente: true, itens: { select: { valor_total: true } } },
    })

    return lista.map((o) => ({
      ...o,
      total_itens: o.itens.reduce((acc, i) => acc + Number(i.valor_total || 0), 0),
    }))
  }

  async detalhar(id: number) {
    const orc = await this.prisma.orcamentos.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: { orderBy: { id: 'asc' } },
        arquivos: { orderBy: { id: 'desc' } },
      },
    })
    if (!orc) throw new NotFoundException('Orçamento não encontrado.')
    return orc
  }

  async atualizar(id: number, dto: UpdateOrcamentoDto) {
    // ✅ garante NotFoundException padronizada
    await this.detalhar(id)

    // ✅ troca de cliente (se vier)
    if (dto.cliente_id !== undefined && dto.cliente_id !== null) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: dto.cliente_id },
      })
      if (!cliente) throw new NotFoundException('Cliente não encontrado.')

      return this.prisma.orcamentos.update({
        where: { id },
        data: {
          cliente_id: cliente.id,
          cliente_nome_snapshot: cliente.nome_completo,
          cliente_cpf_snapshot: cliente.cpf || '',
        },
        include: { cliente: true, itens: true, arquivos: true },
      })
    }

    return this.prisma.orcamentos.update({
      where: { id },
      data: {
        cliente_nome_snapshot: dto.cliente_nome_snapshot,
        cliente_cpf_snapshot: dto.cliente_cpf_snapshot,
      },
      include: { cliente: true, itens: true, arquivos: true },
    })
  }

  async remover(id: number) {
    // ✅ garante NotFoundException padronizada
    await this.detalhar(id)

    const dir = path.resolve(process.cwd(), 'uploads', 'orcamentos', String(id))
    await fs.rm(dir, { recursive: true, force: true }).catch(() => null)

    return this.prisma.orcamentos.delete({ where: { id } })
  }

  // =========================================================
  // ITENS
  // =========================================================
  async adicionarItem(orcamentoId: number, dto: CreateOrcamentoItemDto) {
    // ✅ garante que orçamento existe
    await this.detalhar(orcamentoId)

    const valor = Number(dto.valor_unitario || 0)

    const item = await this.prisma.orcamento_itens.create({
      data: {
        orcamento_id: orcamentoId,
        nome_ambiente: dto.nome_ambiente,
        descricao: dto.descricao,
        observacao: dto.observacao,
        valor_unitario: valor,
        valor_total: valor,
      },
    })

    await this.atualizarQtdAmbientes(orcamentoId)

    return item
  }

  async atualizarItem(orcId: number, itemId: number, dto: UpdateOrcamentoItemDto) {
    // ✅ garante que o item pertence ao orçamento
    const existe = await this.prisma.orcamento_itens.findFirst({
      where: { id: itemId, orcamento_id: orcId },
    })
    if (!existe) throw new NotFoundException('Item não encontrado para este orçamento.')

    const data: any = {
      nome_ambiente: dto.nome_ambiente,
      descricao: dto.descricao,
      observacao: dto.observacao,
    }

    // ✅ só mexe em valor quando vier no DTO
    if (dto.valor_unitario !== undefined) {
      const valor = Number(dto.valor_unitario || 0)
      data.valor_unitario = valor
      data.valor_total = valor // ✅ TRAVADO (segue unitário)
    }

    return this.prisma.orcamento_itens.update({
      where: { id: itemId },
      data,
    })
  }

  async removerItem(orcId: number, itemId: number) {
    // ✅ garante que o item pertence ao orçamento
    const existe = await this.prisma.orcamento_itens.findFirst({
      where: { id: itemId, orcamento_id: orcId },
    })
    if (!existe) throw new NotFoundException('Item não encontrado para este orçamento.')

    await this.prisma.orcamento_itens.delete({
      where: { id: itemId },
    })

    await this.atualizarQtdAmbientes(orcId)
  }

  private async atualizarQtdAmbientes(orcamentoId: number) {
    const count = await this.prisma.orcamento_itens.count({
      where: { orcamento_id: orcamentoId },
    })

    await this.prisma.orcamentos.update({
      where: { id: orcamentoId },
      data: { qtd_ambientes: count },
    })
  }

  // =========================================================
  // ARQUIVOS
  // =========================================================
  async anexarArquivo(orcId: number, file: any) {
    if (!file) throw new BadRequestException('Arquivo não enviado.')

    // ✅ garante que orçamento existe
    await this.detalhar(orcId)

    const pasta = path.resolve(process.cwd(), 'uploads', 'orcamentos', String(orcId))
    await fs.mkdir(pasta, { recursive: true })

    const nomeFinal = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`
    const caminhoFinal = path.join(pasta, nomeFinal)

    await fs.writeFile(caminhoFinal, file.buffer)

    return this.prisma.orcamento_arquivos.create({
      data: {
        orcamento_id: orcId,
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tamanho: file.size,
        caminho: `uploads/orcamentos/${orcId}/${nomeFinal}`,
      },
    })
  }

  async obterArquivo(orcId: number, arquivoId: number) {
    const arq = await this.prisma.orcamento_arquivos.findFirst({
      where: { id: arquivoId, orcamento_id: orcId },
    })
    if (!arq) throw new NotFoundException('Arquivo não encontrado.')

    return { arq, abs: path.resolve(process.cwd(), arq.caminho) }
  }

  async listarArquivos(orcId: number) {
    // ✅ garante que orçamento existe
    await this.detalhar(orcId)

    return this.prisma.orcamento_arquivos.findMany({
      where: { orcamento_id: orcId },
      orderBy: { id: 'desc' },
    })
  }

  async removerArquivo(orcId: number, arquivoId: number) {
    const arq = await this.prisma.orcamento_arquivos.findFirst({
      where: { id: arquivoId, orcamento_id: orcId },
    })
    if (!arq) throw new NotFoundException('Arquivo não encontrado.')

    // remove físico
    const abs = path.resolve(process.cwd(), arq.caminho)
    await fs.unlink(abs).catch(() => null)

    // remove registro
    await this.prisma.orcamento_arquivos.delete({ where: { id: arquivoId } })
  }
}
