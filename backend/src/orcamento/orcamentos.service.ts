import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Response } from 'express'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Orcamento } from './orcamento.entity'

@Injectable()
export class OrcamentosService {
  constructor(
    @InjectRepository(Orcamento)
    private readonly repo: Repository<Orcamento>
  ) {}

  async findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: { ambientes: { opcoes: true } }
    })
  }

  private moneyBR(v: number) {
    return `R$ ${Number(v || 0).toFixed(2)}`.replace('.', ',')
  }

  async gerarPdfTemplate(id: number, res: Response) {
    const orc = await this.findOne(id)
    if (!orc) {
      res.status(404).json({ error: 'Orçamento não encontrado' })
      return
    }

    const coverPath = path.join(process.cwd(), 'src/orcamento/templates/Logo Orçamento.pdf')
    const pagePath  = path.join(process.cwd(), 'src/orcamento/templates/Paginas Seguintes.pdf')

    const coverBytes = fs.readFileSync(coverPath)
    const pageBytes  = fs.readFileSync(pagePath)

    const coverPdf = await PDFDocument.load(coverBytes)
    const pagePdf  = await PDFDocument.load(pageBytes)

    const out = await PDFDocument.create()

    // 1) CAPA (copia a página 1 do seu PDF de capa)
    const [coverPage] = await out.copyPages(coverPdf, [0])
    out.addPage(coverPage)

    // Fonte padrão (só pros textos variáveis; o template já tem o resto)
    const font = await out.embedFont(StandardFonts.Helvetica)

    // 2) Para cada ambiente/opção, gera uma página baseada no template "Paginas Seguintes"
    // Se você quiser 1 página por AMBIENTE (com várias opções), dá pra ajustar.
    for (const amb of (orc.ambientes || [])) {
      for (const opc of (amb.opcoes || [])) {
        const [basePage] = await out.copyPages(pagePdf, [0])
        const p = out.addPage(basePage)

        // ⚠️ Coordenadas (x,y) precisam ser ajustadas 1 vez pra bater certinho no seu layout.
        // A4 em PDF costuma ser ~595x842 pts.
        // Começo sugerido (ajustamos depois):
        const X_LEFT = 60
        const Y_TOP  = 740

        // Cabeçalho variável
        p.drawText(`Cliente: ${orc.cliente_nome}`, { x: X_LEFT, y: Y_TOP, size: 11, font, color: rgb(0,0,0) })
        p.drawText(`Endereço: ${orc.cliente_endereco || '-'}`, { x: X_LEFT, y: Y_TOP - 18, size: 10, font })
        p.drawText(`Contato: ${orc.cliente_contato || '-'}`, { x: X_LEFT, y: Y_TOP - 34, size: 10, font })
        p.drawText(`Data: ${orc.data_orcamento}`, { x: 420, y: Y_TOP, size: 10, font })

        // Bloco do item/ambiente + opção
        p.drawText(`Item/ambiente: ${amb.nome}`, { x: X_LEFT, y: Y_TOP - 80, size: 11, font })
        p.drawText(`Opção: ${opc.titulo}`, { x: X_LEFT, y: Y_TOP - 98, size: 11, font })

        // Descritivo (texto grande)
        // (Aqui é propositalmente simples; se quiser quebra de linha perfeita, a gente melhora com função de wrap)
        p.drawText(`Descritivo:`, { x: X_LEFT, y: Y_TOP - 125, size: 11, font })
        p.drawText(opc.descritivo || '', { x: X_LEFT, y: Y_TOP - 145, size: 10, font, maxWidth: 480, lineHeight: 14 })

        // Valor
        p.drawText(`Valor: ${this.moneyBR(opc.valor as any)}`, { x: 420, y: Y_TOP - 80, size: 12, font })

        // Textos do rodapé (se você quiser manter fixo no template, pode nem desenhar aqui)
        // O seu template já contém "Orçamento válido..." :contentReference[oaicite:4]{index=4}
        // Então só desenhamos se você quiser substituir dinamicamente:
        // p.drawText(`Orçamento válido por ${orc.validade_dias} dias úteis.`, { x: X_LEFT, y: 70, size: 10, font })
      }
    }

    const pdfBytes = await out.save()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=orcamento-${id}.pdf`)
    res.end(Buffer.from(pdfBytes))
  }
}
