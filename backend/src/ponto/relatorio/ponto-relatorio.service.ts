import { Injectable,BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import * as path from 'path'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'
import PDFDocument from 'pdfkit'
import { renderHeaderA4Png } from '../../pdf/render-header-a4'


type Filtros = {
  funcionario_id?: string
  data_ini?: string // YYYY-MM-DD
  data_fim?: string // YYYY-MM-DD
  tipo?: 'ENTRADA' | 'SAIDA'
  origem?: 'PWA' | 'WEB' | 'ADMIN'
  status?: 'ATIVO' | 'INVALIDADO'
}

@Injectable()
export class PontoRelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  private inicioDia(ymd?: string) {
    if (!ymd) return undefined
    return new Date(`${ymd}T00:00:00.000Z`)
  }

  private fimDia(ymd?: string) {
    if (!ymd) return undefined
    return new Date(`${ymd}T23:59:59.999Z`)
  }

  private cleanId(v?: string) {
    if (!v) return undefined
    const id = Number(String(v).replace(/\D/g, ''))
    return id ? id : undefined
  }

  async listar(f: Filtros) {
    const where: Prisma.ponto_registrosWhereInput = {}

    const funcionarioId = this.cleanId(f.funcionario_id)
    if (funcionarioId) where.funcionario_id = funcionarioId

    if (f.tipo) where.tipo = f.tipo
    if (f.origem) where.origem = f.origem
    if (f.status) where.status = f.status

    const ini = this.inicioDia(f.data_ini)
    const fim = this.fimDia(f.data_fim)
    if (ini || fim) {
      where.data_hora = {
        ...(ini ? { gte: ini } : {}),
        ...(fim ? { lte: fim } : {}),
      }
    }

    const rows = await this.prisma.ponto_registros.findMany({
      where,
      orderBy: { data_hora: 'desc' },
      select: {
        id: true,
        tipo: true,
        origem: true,
        data_hora: true,

        latitude: true,
        longitude: true,
        precisao_metros: true,

        cep: true,
        rua: true,
        bairro: true,
        cidade: true,
        estado: true,

        ip: true,
        status: true,
        observacao: true,

        funcionario: { select: { id: true, nome: true } },
        dispositivo: { select: { id: true, device_nome: true, plataforma: true } },
      },
    })

    return rows.map((r) => ({
      ...r,
      latitude: r.latitude != null ? Number(r.latitude) : null,
      longitude: r.longitude != null ? Number(r.longitude) : null,
    }))
  }

  // ✅ DADOS DO PDF (mensal)
  async relatorioMensalPdfData(params: { funcionario_id: number; mes: number; ano: number }) {
    const { funcionario_id, mes, ano } = params




    const dataIni = new Date(ano, mes - 1, 1, 0, 0, 0, 0)
    const dataFim = new Date(ano, mes, 1, 0, 0, 0, 0) // exclusivo

    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { id: true, nome: true },
    })

    const registros = await this.prisma.ponto_registros.findMany({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data_hora: 'asc' },
      select: { data_hora: true, tipo: true, origem: true, status: true },
    })

    const justificativas = await this.prisma.ponto_justificativas.findMany({
      where: {
        funcionario_id,
        data: { gte: dataIni, lt: dataFim },
      },
      orderBy: { data: 'asc' },
      select: { data: true, tipo: true, descricao: true },
    })

    return { funcionario, registros, justificativas }
  }


  
  // ✅ GERA BUFFER DO PDF (pra salvar em arquivos depois)
private async gerarPdfPontoBuffer(payload: {
  funcionarioNome: string
  funcionarioId: number
  mes: number
  ano: number
  registros: Array<{ data_hora: Date; tipo: string; origem?: string }>
  justificativas: Array<{ data: Date; tipo: string; descricao?: string | null }>
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      const headerBottomY = renderHeaderA4Png(doc)
      
      // --- CABEÇALHO DE IDENTIFICAÇÃO ---
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('ESPELHO DE PONTO MENSAL', 40, headerBottomY + 20)
      
      doc.fontSize(10).font('Helvetica').fillColor('#64748b')
      doc.text(`Funcionário: `, 40, doc.y + 5, { continued: true }).fillColor('#000').font('Helvetica-Bold').text(payload.funcionarioNome.toUpperCase())
      doc.fillColor('#64748b').font('Helvetica').text(`Competência: `, { continued: true }).fillColor('#000').font('Helvetica-Bold').text(`${String(payload.mes).padStart(2, '0')}/${payload.ano}`)
      
      doc.moveDown(2)

      // --- TABELA DE REGISTROS ---
      const tableTop = doc.y
      const colData = 40, colEnt1 = 120, colSai1 = 180, colEnt2 = 240, colSai2 = 300, colObs = 360

      // Header da Tabela
      doc.rect(40, tableTop, 515, 20).fill('#f1f5f9')
      doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold')
      doc.text('DATA', colData + 5, tableTop + 6)
      doc.text('ENT 1', colEnt1, tableTop + 6)
      doc.text('SAI 1', colSai1, tableTop + 6)
      doc.text('ENT 2', colEnt2, tableTop + 6)
      doc.text('SAI 2', colSai2, tableTop + 6)
      doc.text('OBSERVAÇÕES', colObs, tableTop + 6)

      // Agrupar registros por dia para a tabela
      const diasNoMes = new Date(payload.ano, payload.mes, 0).getDate()
      let currentY = tableTop + 20

      for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataLoop = new Date(payload.ano, payload.mes - 1, dia)
        if (dataLoop.getDay() === 0) continue // Pula domingos se desejar, ou estilize diferente

        const regsDia = payload.registros.filter(r => new Date(r.data_hora).getDate() === dia)
        const ents = regsDia.filter(r => r.tipo === 'ENTRADA').sort((a,b) => a.data_hora.getTime() - b.data_hora.getTime())
        const sais = regsDia.filter(r => r.tipo === 'SAIDA').sort((a,b) => a.data_hora.getTime() - b.data_hora.getTime())
        const just = payload.justificativas.find(j => new Date(j.data).getDate() === dia)

        // Linha zebrada
        if (dia % 2 === 0) doc.rect(40, currentY, 515, 18).fill('#fafafa')
        
        doc.fillColor('#1e293b').font('Helvetica').fontSize(8)
        const dataFmt = `${String(dia).padStart(2, '0')}/${String(payload.mes).padStart(2, '0')}`
        
        doc.text(dataFmt, colData + 5, currentY + 5)
        doc.text(ents[0] ? this.formatHora(ents[0].data_hora) : '--:--', colEnt1, currentY + 5)
        doc.text(sais[0] ? this.formatHora(sais[0].data_hora) : '--:--', colSai1, currentY + 5)
        doc.text(ents[1] ? this.formatHora(ents[1].data_hora) : '--:--', colEnt2, currentY + 5)
        doc.text(sais[1] ? this.formatHora(sais[1].data_hora) : '--:--', colSai2, currentY + 5)
        
        if (just) {
          doc.fillColor('#e11d48').fontSize(7).text(just.tipo.substring(0, 25), colObs, currentY + 5)
        }

        currentY += 18

        // Quebra de página se necessário
        if (currentY > 750) {
          doc.addPage()
          currentY = 50
        }
      }

      // --- ASSINATURAS ---
      doc.moveDown(4)
      const sigY = doc.y > 700 ? (doc.addPage(), 100) : doc.y + 50
      
      doc.strokeColor('#cbd5e1').lineWidth(0.5)
      doc.moveTo(40, sigY).lineTo(240, sigY).stroke()
      doc.moveTo(315, sigY).lineTo(515, sigY).stroke()
      
      doc.fontSize(8).fillColor('#475569')
      doc.text('ASSINATURA DO FUNCIONÁRIO', 40, sigY + 5, { width: 200, align: 'center' })
      doc.text('RESPONSÁVEL / EMPRESA', 315, sigY + 5, { width: 200, align: 'center' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

// Helper dentro da classe
private formatHora(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

async gerarPdfMensalESalvar(params: { funcionario_id: number; mes: number; ano: number }) {
  const funcId = Number(params.funcionario_id)
  const mes = Number(params.mes)
  const ano = Number(params.ano)

  if (!funcId) throw new BadRequestException('funcionario_id inválido')
  if (!mes || mes < 1 || mes > 12) throw new BadRequestException('mes inválido')
  if (!ano || ano < 2000) throw new BadRequestException('ano inválido')

  const { funcionario, registros, justificativas } = await this.relatorioMensalPdfData({
    funcionario_id: funcId,
    mes,
    ano,
  })

  const pdfBuffer = await this.gerarPdfPontoBuffer({
    funcionarioNome: funcionario?.nome || '',
    funcionarioId: funcId,
    mes,
    ano,
    registros,
    justificativas,
  })

  // ✅ padrão: /uploads/<ownerType>s/
  const dir = path.join(process.cwd(), 'uploads', 'funcionarios')
  await fs.mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const rand = randomBytes(6).toString('hex')
  const filename = `ponto_${funcId}_${ano}${String(mes).padStart(2, '0')}_${stamp}_${rand}.pdf`

  await fs.writeFile(path.join(dir, filename), pdfBuffer)

  // ✅ URL tem que bater com a pasta real
  const url = `/uploads/funcionarios/${filename}`

  const arquivo = await this.prisma.arquivos.create({
    data: {
      owner_type: 'FUNCIONARIO',
      owner_id: funcId,
      categoria: 'RELATORIO',
      slot_key: null,
      url,
      filename,
      nome: `RELATÓRIO PONTO ${String(mes).padStart(2, '0')}/${ano} - ${funcionario?.nome || ''}`,
      mime_type: 'application/pdf',
      tamanho: pdfBuffer.length,
    },
    select: { id: true },
  })

  return { arquivoId: arquivo.id }
}

}
