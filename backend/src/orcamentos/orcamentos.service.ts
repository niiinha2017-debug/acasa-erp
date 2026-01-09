import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto';
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

// Importante: instalar com 'npm install pdfkit pdf-lib'
import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLib } from 'pdf-lib';

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  // --- LÓGICA DE GERAÇÃO DE PDF (Agora dentro da classe) ---

  async gerarPdfCompleto(orc: any): Promise<Uint8Array> {
    const miolo = await this.gerarMioloPdfBuffer(orc);
    return this.mesclarCapaMioloRodape(miolo);
  }

  private async gerarMioloPdfBuffer(orc: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text('ORÇAMENTO', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(11).text(`Cliente: ${orc.cliente_nome_snapshot}`);
      doc.text(`CPF: ${orc.cliente_cpf_snapshot || '-'}`);
      doc.moveDown(1);

      let total = 0;
      for (const item of orc.itens || []) {
        const vt = Number(item.valor_total || 0);
        total += vt;
        doc.fontSize(10).text(`Ambiente: ${item.nome_ambiente}`);
        doc.text(`Descrição: ${item.descricao}`);
        doc.text(`Valor unitário: R$ ${Number(item.valor_unitario).toFixed(2)}`);
        doc.text(`Valor total: R$ ${vt.toFixed(2)}`);
        doc.moveDown(0.8);
        if (doc.y > 740) doc.addPage();
      }

      doc.moveDown(1);
      doc.fontSize(12).text(`Total do orçamento: R$ ${total.toFixed(2)}`, { bold: true });
      doc.end();
    });
  }

  private async mesclarCapaMioloRodape(miolo: Buffer): Promise<Uint8Array> {
    const capaPath = path.resolve(process.cwd(), 'assets', 'pdf', 'Logo Orçamento.pdf');
    const rodapePath = path.resolve(process.cwd(), 'assets', 'pdf', 'Paginas Seguintes.pdf');

    const [capaBytes, rodapeBytes] = await Promise.all([
      fs.readFile(capaPath),
      fs.readFile(rodapePath),
    ]);

    const out = await PDFLib.create();
    const capaDoc = await PDFLib.load(capaBytes);
    const mioloDoc = await PDFLib.load(miolo);
    const rodapeDoc = await PDFLib.load(rodapeBytes);

    const docs = [capaDoc, mioloDoc, rodapeDoc];
    for (const d of docs) {
      const pages = await out.copyPages(d, d.getPageIndices());
      pages.forEach(p => out.addPage(p));
    }

    return out.save();
  }

  // --- CRUD E OUTROS MÉTODOS ---

  async criar(dto: CreateOrcamentoDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.cliente_id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    return this.prisma.orcamentos.create({
      data: {
        cliente_id: cliente.id,
        cliente_nome_snapshot: cliente.nome_completo,
        cliente_cpf_snapshot: cliente.cpf || '',
      },
      include: { cliente: true, itens: true, arquivos: true },
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
        arquivos: { orderBy: { id: 'desc' } },
      },
    });
    if (!orc) throw new NotFoundException('Orçamento não encontrado.');
    return orc;
  }

  async atualizar(id: number, dto: UpdateOrcamentoDto) {
    return this.prisma.orcamentos.update({
      where: { id },
      data: {
        cliente_nome_snapshot: dto.cliente_nome_snapshot,
        cliente_cpf_snapshot: dto.cliente_cpf_snapshot,
      },
    });
  }

  async remover(id: number) {
    const dir = path.resolve(process.cwd(), 'uploads', 'orcamentos', String(id));
    await fs.rm(dir, { recursive: true, force: true }).catch(() => null);
    return this.prisma.orcamentos.delete({ where: { id } });
  }

  async adicionarItem(orcamentoId: number, dto: CreateOrcamentoItemDto) {
    return this.prisma.orcamento_itens.create({
      data: {
        orcamento_id: orcamentoId,
        nome_ambiente: dto.nome_ambiente,
        descricao: dto.descricao,
        valor_unitario: Number(dto.valor_unitario),
        valor_total: Number(dto.valor_total),
      },
    });
  }

  async atualizarItem(orcId: number, itemId: number, dto: UpdateOrcamentoItemDto) {
    return this.prisma.orcamento_itens.update({
      where: { id: itemId },
      data: {
        nome_ambiente: dto.nome_ambiente,
        descricao: dto.descricao,
        valor_unitario: dto.valor_unitario ? Number(dto.valor_unitario) : undefined,
        valor_total: dto.valor_total ? Number(dto.valor_total) : undefined,
      },
    });
  }

  async removerItem(orcId: number, itemId: number) {
    return this.prisma.orcamento_itens.delete({ where: { id: itemId } });
  }

  async anexarArquivo(orcId: number, file: any) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    const pasta = path.resolve(process.cwd(), 'uploads', 'orcamentos', String(orcId));
    await fs.mkdir(pasta, { recursive: true });
    const nomeFinal = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const caminhoFinal = path.join(pasta, nomeFinal);
    await fs.writeFile(caminhoFinal, file.buffer);
    return this.prisma.orcamento_arquivos.create({
      data: {
        orcamento_id: orcId,
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tamanho: file.size,
        caminho: `uploads/orcamentos/${orcId}/${nomeFinal}`,
      },
    });
  }

  async obterArquivo(orcId: number, arquivoId: number) {
    const arq = await this.prisma.orcamento_arquivos.findFirst({
      where: { id: arquivoId, orcamento_id: orcId },
    });
    if (!arq) throw new NotFoundException('Arquivo não encontrado.');
    return { arq, abs: path.resolve(process.cwd(), arq.caminho) };
  }
}