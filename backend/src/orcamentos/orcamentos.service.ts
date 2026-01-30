import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrcamentoDto } from './dto/create-orcamento.dto'
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto'
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto'
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto'
import * as path from 'path'
import { renderHeaderA4Png, resolveAsset } from '../pdf/render-header-a4'
import PDFKitDoc from 'pdfkit'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'



@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // PDF
  // =========================================================
  async gerarPdfCompleto(orc: any): Promise<Uint8Array> {
    const pdf = await this.gerarMioloPdfBuffer(orc);
    return pdf;
  }

  private async gerarMioloPdfBuffer(orc: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFKitDoc({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    try {
      const brl = (v: any) =>
        Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

      const left = 40
      const right = doc.page.width - 40
      const tableWidth = right - left
      const colAmbW = 140
      const colValW = 100
      const colDescW = tableWidth - colAmbW - colValW

      const aplicarLayoutPagina = () => {
        const startY = renderHeaderA4Png(doc)

        doc.y = startY + 10
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#000').text('ORÇAMENTO', left, doc.y, { align: 'center' })
        doc.font('Helvetica').fontSize(7).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })

        doc.y += 10
        doc.lineWidth(0.5).strokeColor('#D6D6D6').moveTo(left, doc.y).lineTo(right, doc.y).stroke()

        doc.y += 5
        const c = orc?.cliente || {}
        const nome = String(c.nome_completo || c.razao_social || '-').toUpperCase()
        const tel = String(c.whatsapp || c.telefone || c.contato || c.celular || '-')

        const endPartes = [
          c.endereco,
          c.numero ? `Nº ${c.numero}` : null,
          c.complemento ? `(${c.complemento})` : null,
          c.bairro ? `Bairro: ${c.bairro}` : null,
          c.cidade ? `${c.cidade}${c.estado ? ' - ' + c.estado : ''}` : null,
          c.cep ? `CEP: ${c.cep}` : null,
        ].filter(Boolean)

        const enderecoCompleto = endPartes.join(' - ') || '-'

        const drawData = (label: string, value: string) => {
          const labelWidth = 60
          const sY = doc.y

          doc.font('Helvetica-Bold').fontSize(9).text(label, left, sY, { width: labelWidth })

          const vW = right - (left + labelWidth)
          const h = doc.heightOfString(value, { width: vW })

          doc.font('Helvetica').fontSize(9).text(value, left + labelWidth, sY, { width: vW, align: 'left' })
          doc.y = sY + Math.max(h, 10) + 3
        }

        drawData('CLIENTE:', nome)
        drawData('FONE:', tel)
        drawData('END:', enderecoCompleto)

        doc.y += 8
        doc.lineWidth(0.5).strokeColor('#D6D6D6').moveTo(left, doc.y).lineTo(right, doc.y).stroke()

        doc.y += 8
        const headerY = doc.y
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')

        doc.text('ITEM / AMBIENTE', left, headerY, { width: colAmbW })
        doc.text('ACABAMENTO / DESCRITIVO', left + colAmbW, headerY, { width: colDescW, align: 'center' })
        doc.text('VALOR', right - colValW, headerY, { width: colValW, align: 'right' })

        doc.y = headerY + 14
        doc.lineWidth(1).strokeColor('#000').moveTo(left, doc.y).lineTo(right, doc.y).stroke()
        doc.y += 10
      }

      // CAPA
      const capaPath = resolveAsset(path.join('pdf', 'capa-a4.png'))
      doc.image(capaPath, 0, 0, { width: doc.page.width, height: doc.page.height })

      // quando quebra página, reaplica header/tabela
      doc.on('pageAdded', () => aplicarLayoutPagina())

      // Página 2
      doc.addPage()
      aplicarLayoutPagina()

      // ITENS
      let total = 0

      for (const item of orc.itens || []) {
        const vt = Number(item.valor_total || 0)
        total += vt

        const ambiente = String(item.nome_ambiente || '-').toUpperCase()

        const descBase = String(item.descricao || '')
        const linhas = descBase
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `• ${l}`)

        const bulletsText = linhas.length ? linhas.join('\n') : '-'

        const obs = String(item.observacao || '').trim()
        const obsText = obs ? `OBS TÉCNICA: ${obs}` : ''

        // alturas
        doc.font('Helvetica-Bold').fontSize(9)
        const hAmb = doc.heightOfString(ambiente, { width: colAmbW })

        doc.font('Helvetica').fontSize(9)
        const hBullets = doc.heightOfString(bulletsText, { width: colDescW })

        doc.font('Helvetica-Bold').fontSize(9)
        const hObs = obsText ? doc.heightOfString(obsText, { width: colDescW }) : 0

        const gap = obsText ? 8 : 0
        const hDesc = hBullets + gap + hObs
        const rowH = Math.max(hAmb, hDesc)

        // quebra página antes de imprimir
        if (doc.y + rowH + 60 > doc.page.height) doc.addPage()

        const curY = doc.y

        // ambiente (negrito)
        doc.font('Helvetica-Bold').fontSize(9).text(ambiente, left, curY, { width: colAmbW })

        // bullets normal
        doc.font('Helvetica').fontSize(9).text(bulletsText, left + colAmbW, curY, { width: colDescW, align: 'left' })

        // obs técnica em negrito
        if (obsText) {
          doc.font('Helvetica-Bold').fontSize(9).text(obsText, left + colAmbW, curY + hBullets + gap, {
            width: colDescW,
            align: 'left',
          })
        }

        // valor (negrito)
        doc.font('Helvetica-Bold').fontSize(9).text(brl(vt), right - colValW, curY, { width: colValW, align: 'right' })

        // separador
        doc.y = curY + rowH + 10
        doc.lineWidth(0.2).strokeColor('#E5E5E5').moveTo(left, doc.y).lineTo(right, doc.y).stroke()
        doc.y += 8
      }

      // TOTAL
      if (doc.y + 60 > doc.page.height) doc.addPage()
      doc.y += 10
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#000')
      doc.text(`Total do orçamento: ${brl(total)}`, left, doc.y, { width: tableWidth, align: 'right' })

      doc.end()
    } catch (e) {
      reject(e)
    }
  })
}


async gerarPdfESalvar(orcId: number) {
  const orc = await this.detalhar(orcId)

  // você já tem isso pronto:
  const pdfBuffer = await this.gerarMioloPdfBuffer(orc) // Buffer

  const dir = path.join(process.cwd(), 'uploads', 'relatorios')
  await fs.mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const rand = randomBytes(6).toString('hex')
  const filename = `orcamento_${orcId}_${stamp}_${rand}.pdf`

  await fs.writeFile(path.join(dir, filename), pdfBuffer)

  const url = `/uploads/relatorios/${filename}`

  const arquivo = await this.prisma.arquivos.create({
    data: {
      owner_type: 'ORCAMENTO',
      owner_id: orcId,
      categoria: 'RELATORIO',
      slot_key: null,                 // ✅ IMPORTANTÍSSIMO (senão bate no @@unique)
      url,
      filename,
      nome: `ORÇAMENTO #${orcId}`,
      mime_type: 'application/pdf',
      tamanho: pdfBuffer.length,
    },
    select: { id: true },
  })

  return { arquivoId: arquivo.id }
}

  // =========================================================
  // CRUD - ORÇAMENTOS
  // =========================================================
  async criar(dto: CreateOrcamentoDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    return this.prisma.orcamentos.create({
      data: {
        cliente_id: cliente.id,
        cliente_nome_snapshot: cliente.nome_completo,
        cliente_cpf_snapshot: cliente.cpf || '',
        qtd_ambientes: 0,
      },
      include: { cliente: true, itens: true},
    });
  }

  async listar() {
    const lista = await this.prisma.orcamentos.findMany({
      orderBy: { id: 'desc' },
      include: { cliente: true, itens: { select: { valor_total: true } } },
    });

    return lista.map((o) => ({
      ...o,
      total_itens: o.itens.reduce((acc, i) => acc + Number(i.valor_total || 0), 0),
    }));
  }

async detalhar(id: number) {
  const orc = await this.prisma.orcamentos.findUnique({
    where: { id },
    include: {
      cliente: true,
      itens: { orderBy: { id: 'asc' } },
    },
  })
  if (!orc) throw new NotFoundException('Orçamento não encontrado.')
  return orc
}


  async atualizar(id: number, dto: UpdateOrcamentoDto) {
    await this.detalhar(id);

    if (dto.cliente_id !== undefined && dto.cliente_id !== null) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: dto.cliente_id },
      });
      if (!cliente) throw new NotFoundException('Cliente não encontrado.');

      return this.prisma.orcamentos.update({
        where: { id },
        data: {
          cliente_id: cliente.id,
          cliente_nome_snapshot: cliente.nome_completo,
          cliente_cpf_snapshot: cliente.cpf || '',
        },
        include: { cliente: true, itens: true },
      });
    }

    return this.prisma.orcamentos.update({
      where: { id },
      data: {
        cliente_nome_snapshot: dto.cliente_nome_snapshot,
        cliente_cpf_snapshot: dto.cliente_cpf_snapshot,
      },
      include: { cliente: true, itens: true},
    });
  }

async remover(id: number) {
  await this.detalhar(id)
  return this.prisma.orcamentos.delete({ where: { id } })
}


  // =========================================================
  // ITENS
  // =========================================================
  async adicionarItem(orcamentoId: number, dto: CreateOrcamentoItemDto) {
    await this.detalhar(orcamentoId);
    const valor = Number(dto.valor_unitario || 0);

    const item = await this.prisma.orcamento_itens.create({
      data: {
        orcamento_id: orcamentoId,
        nome_ambiente: dto.nome_ambiente,
        descricao: dto.descricao,
        observacao: dto.observacao,
        valor_unitario: valor,
        valor_total: valor,
      },
    });
    await this.atualizarQtdAmbientes(orcamentoId);
    return item;
  }

  async atualizarItem(orcId: number, itemId: number, dto: UpdateOrcamentoItemDto) {
    const existe = await this.prisma.orcamento_itens.findFirst({
      where: { id: itemId, orcamento_id: orcId },
    });
    if (!existe) throw new NotFoundException('Item não encontrado.');

    const data: any = {
      nome_ambiente: dto.nome_ambiente,
      descricao: dto.descricao,
      observacao: dto.observacao,
    };

    if (dto.valor_unitario !== undefined) {
      const valor = Number(dto.valor_unitario || 0);
      data.valor_unitario = valor;
      data.valor_total = valor;
    }

    return this.prisma.orcamento_itens.update({
      where: { id: itemId },
      data,
    });
  }

  async removerItem(orcId: number, itemId: number) {
    const existe = await this.prisma.orcamento_itens.findFirst({
      where: { id: itemId, orcamento_id: orcId },
    });
    if (!existe) throw new NotFoundException('Item não encontrado.');

    await this.prisma.orcamento_itens.delete({ where: { id: itemId } });
    await this.atualizarQtdAmbientes(orcId);
  }

  private async atualizarQtdAmbientes(orcamentoId: number) {
    const count = await this.prisma.orcamento_itens.count({
      where: { orcamento_id: orcamentoId },
    });
    await this.prisma.orcamentos.update({
      where: { id: orcamentoId },
      data: { qtd_ambientes: count },
    });
  }
}