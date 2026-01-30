import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { promises as fs } from 'fs'
import { randomBytes } from 'crypto'
import * as path from 'path'
import PDFDocument from 'pdfkit'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'
import { renderHeaderA4Png } from '../pdf/render-header-a4'


@Injectable()
export class FuncionariosService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly STATUS_ATIVO = 'ATIVO'
  private readonly STATUS_INATIVO = 'INATIVO'

private calcularStatus(input: {
  registro?: string | null
  admissao?: Date | null
  demissao?: Date | null
}) {
  const registro = input.registro ? String(input.registro).trim() : ''
  const admissao = input.admissao ?? null
  const demissao = input.demissao ?? null

  if (demissao) return this.STATUS_INATIVO
  if (admissao) return this.STATUS_ATIVO
  if (registro) return this.STATUS_ATIVO
  return this.STATUS_INATIVO
}


  async listar() {
    return this.prisma.funcionarios.findMany({
      orderBy: { id: 'desc' },
    })
  }

  async buscarPorId(id: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({ where: { id } })
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado.')
    return funcionario
  }


async gerarPdf(ids: number[]): Promise<Buffer> {
  const funcionarios = await this.prisma.funcionarios.findMany({
    where: { id: { in: ids } },
    select: { nome: true, cpf: true, rg: true },
    orderBy: { nome: 'asc' },
  })

  if (!funcionarios.length) throw new NotFoundException('Nenhum funcionário encontrado.')

  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const chunks: Buffer[] = []

  doc.on('data', (c) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const startY = renderHeaderA4Png(doc) // retorna 120 (ou o que você definir)
  let y = startY + 40

  const renderHeaderTabela = () => {
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text('NOME', 40, y)
    doc.text('CPF', 310, y)
    doc.text('RG', 430, y)

    y += 18
    doc.moveTo(40, y).lineTo(555, y).stroke()
    y += 10
    doc.font('Helvetica').fontSize(10)
  }

  renderHeaderTabela()

  for (const f of funcionarios) {
    if (y > 750) {
      doc.addPage()
      const startY2 = renderHeaderA4Png(doc)
      y = startY2 + 40
      renderHeaderTabela()
    }

    doc.text((f.nome || '-').toUpperCase(), 40, y, { width: 260 })
    doc.text(f.cpf || '-', 310, y)
    doc.text(f.rg || '-', 430, y)
    y += 18
  }

  doc.end()
  return done
}



async gerarPdfESalvar(ids: number[]) {
  const pdfBuffer = await this.gerarPdf(ids)

  const dir = path.join(process.cwd(), 'uploads', 'relatorios')
  await fs.mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const rand = randomBytes(6).toString('hex')
  const filename = `relatorio_funcionarios_${stamp}_${rand}.pdf`

  await fs.writeFile(path.join(dir, filename), pdfBuffer)

  const url = `/uploads/relatorios/${filename}`

  const arquivo = await this.prisma.arquivos.create({
    data: {
      owner_type: 'EMPRESA',
      owner_id: 1,
      categoria: 'RELATORIO',
      slot_key: null, // ✅ importante pra não bater no unique
      url,
      filename,
      nome: `RELATORIO FUNCIONARIOS ${stamp}`,
      mime_type: 'application/pdf',
      tamanho: pdfBuffer.length,
    },
    select: { id: true },
  })

  return { arquivoId: arquivo.id }
}


  async criar(dto: CriarFuncionarioDto) {
  try {
    const data = this.normalizarDatas(dto)

    // ✅ status baseado na sua regra (demissao inativa, admissao/registro ativa)
    ;(data as any).status = this.calcularStatus({
      registro: data.registro,
      admissao: data.admissao,
      demissao: data.demissao,
    })

    return await this.prisma.funcionarios.create({ data })
  } catch (e: any) {
    if (e?.code === 'P2002') throw new BadRequestException('CPF já cadastrado.')
    throw e
  }
}


  async atualizar(id: number, dto: AtualizarFuncionarioDto) {
    await this.buscarPorId(id)

    try {
      const data = this.normalizarDatas(dto)

      // só recalcula se mexeu em registro ou demissao
const mexeuEmRegistro = Object.prototype.hasOwnProperty.call(data, 'registro')
const mexeuEmAdmissao = Object.prototype.hasOwnProperty.call(data, 'admissao')
const mexeuEmDemissao = Object.prototype.hasOwnProperty.call(data, 'demissao')

if (mexeuEmRegistro || mexeuEmAdmissao || mexeuEmDemissao) {
  const atual = await this.prisma.funcionarios.findUnique({
    where: { id },
    select: { registro: true, admissao: true, demissao: true },
  })
  if (!atual) throw new NotFoundException('Funcionário não encontrado.')

  ;(data as any).status = this.calcularStatus({
    registro: mexeuEmRegistro ? (data as any).registro : atual.registro,
    admissao: mexeuEmAdmissao ? (data as any).admissao : atual.admissao,
    demissao: mexeuEmDemissao ? (data as any).demissao : atual.demissao,
  })
}

      return await this.prisma.funcionarios.update({
        where: { id },
        data,
      })
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('CPF já cadastrado.')
      throw e
    }
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    await this.prisma.funcionarios.delete({ where: { id } })
    return { ok: true }
  }

private normalizarDatas(dto: any) {
  const data = { ...dto }
  const camposData = ['data_nascimento', 'admissao', 'demissao']

  for (const campo of camposData) {
    if (Object.prototype.hasOwnProperty.call(data, campo)) {
      const v = data[campo]
      if (!v) {
        data[campo] = null
      } else {
        const d = new Date(v)
        data[campo] = isNaN(d.getTime()) ? null : d
      }
    }
  }

  return data
}

}
