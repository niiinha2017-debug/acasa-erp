import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as fs from 'fs'
import PDFDocument from 'pdfkit'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'

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
    const empresa = await this.prisma.empresa.findUnique({ where: { id: 1 } })

    const funcionarios = await this.prisma.funcionarios.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true, cpf: true, rg: true },
      orderBy: { nome: 'asc' },
    })

    if (!funcionarios.length) throw new NotFoundException('Nenhum funcionário encontrado.')

    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c))
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    if (empresa) {
      if (empresa.logo_url?.startsWith('data:image')) {
        try {
          const base64 = empresa.logo_url.split(',')[1]
          const imgBuffer = Buffer.from(base64, 'base64')
          doc.image(imgBuffer, 40, 30, { width: 60 })
        } catch (e: any) {
          console.log('[PDF] Erro ao renderizar logo:', e?.message)
        }
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(empresa.razao_social || '', 110, 35)
        .font('Helvetica')
        .text(`CNPJ: ${empresa.cnpj || ''}`, 110, 48)
        .text(`${empresa.cidade || ''} - ${empresa.uf || ''}`, 110, 61)
    }

    doc.moveTo(40, 90).lineTo(555, 90).stroke()
    doc.moveDown(4)

    doc.fontSize(16).font('Helvetica-Bold').text('Lista de Funcionários', { align: 'center' })
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
    doc.moveDown(2)

    let y = doc.y
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text('NOME', 40, y)
    doc.text('CPF', 310, y)
    doc.text('RG', 430, y)

    y += 18
    doc.moveTo(40, y).lineTo(555, y).stroke()
    y += 10

    doc.font('Helvetica').fontSize(10)
    for (const f of funcionarios) {
      if (y > 750) {
        doc.addPage()
        y = 50
      }

      doc.text(f.nome?.toUpperCase() || '-', 40, y, { width: 260 })
      doc.text(f.cpf || '-', 310, y)
      doc.text(f.rg || '-', 430, y)

      y += 18
    }

    doc.end()
    return done
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
        data[campo] = data[campo] ? new Date(data[campo]) : null
      }
    }

    return data
  }

    async listarArquivos(funcionario_id: number) {
    return this.prisma.funcionarios_arquivos.findMany({
      where: { funcionario_id },
      orderBy: { criado_em: 'desc' },
      select: { id: true, nome: true, mime: true, tamanho: true, url: true, criado_em: true },
    })
  }

  async uploadArquivo(funcionario_id: number, file: Express.Multer.File) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { id: true },
    })
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado.')

    const url = `/uploads/funcionarios/${file.filename}`

    return this.prisma.funcionarios_arquivos.create({
      data: {
        funcionario_id,
        nome: file.originalname,
        arquivo_nome: file.filename,
        mime: file.mimetype,
        tamanho: file.size,
        url,
      },
      select: { id: true, nome: true, mime: true, tamanho: true, url: true, criado_em: true },
    })
  }

  async removerArquivo(id: number) {
    const arq = await this.prisma.funcionarios_arquivos.findUnique({ where: { id } })
    if (!arq) throw new NotFoundException('Arquivo não encontrado.')

    const base = process.env.UPLOADS_FUNCIONARIOS_PATH || 'uploads/funcionarios'
    const filePath = `${base}/${arq.arquivo_nome}`

    try { fs.unlinkSync(filePath) } catch {}

    await this.prisma.funcionarios_arquivos.delete({ where: { id } })
    return { ok: true }
  }

}
