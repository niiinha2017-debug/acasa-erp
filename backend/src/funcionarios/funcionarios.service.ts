import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import PDFDocument from 'pdfkit'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'

@Injectable()
export class FuncionariosService {
  // Removido o erro: agora só depende do Prisma
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

  // Função principal de PDF corrigida para usar os dados da Empresa (ACASA)
  async gerarPdf(ids: number[]): Promise<Buffer> {
    // 1. Busca os dados da ACASA
    const empresa = await this.prisma.empresa.findUnique({ where: { id: 1 } });

    // 2. Busca os funcionários selecionados
    const funcionarios = await this.prisma.funcionarios.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true, cpf: true, rg: true },
      orderBy: { nome: 'asc' }
    })

    if (!funcionarios.length) {
      throw new NotFoundException('Nenhum funcionário encontrado.')
    }

    // Configuração do PDFKit
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const chunks: Buffer[] = []

    doc.on('data', (c) => chunks.push(c))
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // --- CABEÇALHO ACASA ---
    if (empresa) {
      // Se houver logo em Base64, o PDFKit consegue renderizar
      if (empresa.logo_url && empresa.logo_url.startsWith('data:image')) {
        try {
           doc.image(empresa.logo_url, 40, 30, { width: 60 });
        } catch (e) { console.error("Erro ao renderizar logo no PDF"); }
      }

      doc.fontSize(10).font('Helvetica-Bold')
         .text(empresa.razao_social || '', 110, 35)
         .font('Helvetica')
         .text(`CNPJ: ${empresa.cnpj || ''}`, 110, 48)
         .text(`${empresa.cidade || ''} - ${empresa.uf || ''}`, 110, 61);
    }

    doc.moveTo(40, 90).lineTo(555, 90).stroke(); // Linha divisória
    doc.moveDown(4);

    // Título do Relatório
    doc.fontSize(16).font('Helvetica-Bold').text('Lista de Funcionários', { align: 'center' })
    doc.fontSize(8).font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
    doc.moveDown(2)

    // Cabeçalho da Tabela
    let y = doc.y;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('NOME', 40, y);
    doc.text('CPF', 310, y);
    doc.text('RG', 430, y);
    
    y += 18;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 10;

    // Linhas da Tabela
    doc.font('Helvetica').fontSize(10);
    for (const f of funcionarios) {
      if (y > 750) { doc.addPage(); y = 50; }

      doc.text(f.nome?.toUpperCase() || '-', 40, y, { width: 260 });
      doc.text(f.cpf || '-', 310, y);
      doc.text(f.rg || '-', 430, y);

      y += 18;
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
      if (e?.code === 'P2002') throw new BadRequestException('CPF já cadastrado.')
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
    const data = { ...dto };
    const camposData = ['data_nascimento', 'admissao', 'demissao', 'data_pagamento'];
    camposData.forEach(campo => {
      data[campo] = data[campo] ? new Date(data[campo]) : null;
    });
    return data;
  }
}