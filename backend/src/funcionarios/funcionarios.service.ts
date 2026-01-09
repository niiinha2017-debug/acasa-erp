import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import PDFDocument from 'pdfkit'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'

@Injectable()
export class FuncionariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.funcionarios.findMany({
      orderBy: { id: 'desc' },
    })
  }

  async buscarPorId(id: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id },
    })

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.')
    }

    return funcionario
  }

private normalizarDatas(dto: any) {
  const data = { ...dto };

  // Lista de campos que são Datas no Banco
  const camposData = ['data_nascimento', 'admissao', 'demissao', 'data_pagamento'];

  camposData.forEach(campo => {
    if (data[campo]) {
      // Se tiver valor, converte para Date
      data[campo] = new Date(data[campo]);
    } else {
      // Se vier "" ou undefined, força ser NULL para o Prisma não reclamar
      data[campo] = null;
    }
  });

  return data;
}

 async gerarPdf(ids: number[]): Promise<Buffer> {
    const funcionarios = await this.prisma.funcionarios.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true, cpf: true, rg: true },
      orderBy: { nome: 'asc' }
    })

    if (!funcionarios.length) {
      throw new NotFoundException('Nenhum funcionário encontrado para gerar o PDF.')
    }

    // PDF em memória (Buffer)
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c))
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // Cabeçalho
    doc.fontSize(16).text('Lista de Funcionários', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
    doc.moveDown(1)

    // Tabela simples
    const startX = 40
    let y = doc.y

    const colNome = startX
    const colCpf = 310
    const colRg = 430

    doc.fontSize(11).text('NOME', colNome, y, { width: 260 })
    doc.text('CPF', colCpf, y, { width: 110 })
    doc.text('RG', colRg, y, { width: 120 })
    y += 18
    doc.moveTo(startX, y).lineTo(555, y).stroke()
    y += 10

    doc.fontSize(10)

    for (const f of funcionarios) {
      // Quebra de página
      if (y > 760) {
        doc.addPage()
        y = 60
      }

      doc.text(f.nome || '-', colNome, y, { width: 260 })
      doc.text(f.cpf || '-', colCpf, y, { width: 110 })
      doc.text(f.rg || '-', colRg, y, { width: 120 })

      y += 18
    }

    doc.end()
    return done
  }


  async criar(dto: CriarFuncionarioDto) {
    try {
      return await this.prisma.funcionarios.create({
        data: this.normalizarDatas(dto),
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('CPF já cadastrado.')
      }
      throw e
    }
  }

  async atualizar(id: number, dto: AtualizarFuncionarioDto) {
    await this.buscarPorId(id)

    try {
      return await this.prisma.funcionarios.update({
        where: { id },
        data: this.normalizarDatas(dto),
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('CPF já cadastrado.')
      }
      throw e
    }
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    await this.prisma.funcionarios.delete({ where: { id } })
    return { ok: true }
  }
}
