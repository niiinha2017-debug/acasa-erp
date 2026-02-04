import { Injectable,BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import * as path from 'path'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'
import PDFDocument from 'pdfkit'


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
  registros: Array<{ data_hora: Date; tipo: string; origem?: string; status?: string }>
  justificativas: Array<{ data: Date; tipo: string; descricao?: string | null }>
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 })
      const chunks: Buffer[] = []

      doc.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      doc.fontSize(14).text('RELATÓRIO DE PONTO (MENSAL)', { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(10).text(`Funcionário: ${payload.funcionarioNome || payload.funcionarioId}`)
      doc.text(`Referência: ${String(payload.mes).padStart(2, '0')}/${payload.ano}`)
      doc.moveDown(1)

      doc.fontSize(9).text('REGISTROS:')
      doc.moveDown(0.5)

      payload.registros.forEach((r) => {
        const d = new Date(r.data_hora)
        const dia = d.toLocaleDateString('pt-BR')
        const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        doc.text(`${dia}  ${hora}  |  ${r.tipo}  |  ${r.origem}  |  ${r.status}`)
      })

      doc.moveDown(1)
      doc.fontSize(9).text('JUSTIFICATIVAS:')
      doc.moveDown(0.5)

      payload.justificativas.forEach((j) => {
        const dia = new Date(j.data).toLocaleDateString('pt-BR')
        doc.text(`${dia}  |  ${j.tipo}${j.descricao ? '  |  ' + j.descricao : ''}`)
      })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
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

  const dir = path.join(process.cwd(), 'uploads', 'relatorios')
  await fs.mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const rand = randomBytes(6).toString('hex')
  const filename = `ponto_${funcId}_${ano}${String(mes).padStart(2, '0')}_${stamp}_${rand}.pdf`

  await fs.writeFile(path.join(dir, filename), pdfBuffer)

  const url = `/uploads/relatorios/${filename}`

  const arquivo = await this.prisma.arquivos.create({
    data: {
      owner_type: 'FUNCIONARIO',
      owner_id: funcId,
      categoria: 'RELATORIO',
      slot_key: null, // ✅ histórico (não colide no unique)
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
