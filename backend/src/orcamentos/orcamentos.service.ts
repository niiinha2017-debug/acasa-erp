import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto';
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

// Fixando o import para evitar conflitos com o DOM
const { PDFDocument } = require('pdf-lib'); 
import PDFKitDoc from 'pdfkit';

@Injectable()
export class OrcamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async gerarPdfCompleto(orc: any): Promise<Uint8Array> {
    const miolo = await this.gerarMioloPdfBuffer(orc);
    return this.mesclarCapaMioloRodape(miolo);
  }

  private async gerarMioloPdfBuffer(orc: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFKitDoc({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text('ORÇAMENTO', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(11).text(`Cliente: ${orc.cliente_nome_snapshot}`);
      doc.text(`CPF: ${orc.cliente_cpf_snapshot || '-'}`);
      doc.text(`Qtd. de ambientes: ${orc.qtd_ambientes ?? (orc.itens?.length || 0)}`)
      doc.moveDown(1);
      let total = 0;
      for (const item of orc.itens || []) {
        const vt = Number(item.valor_total || 0);
        total += vt;
        doc.fontSize(10).text(`Ambiente: ${item.nome_ambiente}`);
        doc.text(`Descrição: ${item.descricao}`);
        doc.text(`Observação: ${item.observacao || '-'}`); 
        doc.text(`Valor unitário: R$ ${Number(item.valor_unitario).toFixed(2)}`);
        doc.text(`Valor total: R$ ${vt.toFixed(2)}`);
        doc.moveDown(0.8);
        if (doc.y > 740) doc.addPage();
      }
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(12).text(`Total do orçamento: R$ ${total.toFixed(2)}`);
// Se quiser que o resto do texto volte ao normal depois, adicione:
doc.font('Helvetica');
      doc.end();
    });
  }

private async mesclarCapaMioloRodape(miolo: Buffer): Promise<Uint8Array> {
    const capaPath = path.resolve(process.cwd(), 'assets', 'pdf', 'Logo Orçamento.pdf');
    const rodapePath = path.resolve(process.cwd(), 'assets', 'pdf', 'Paginas Seguintes.pdf');

    const [capaBytes, rodapeBytes] = await Promise.all([
      fs.readFile(capaPath).catch(() => null),
      fs.readFile(rodapePath).catch(() => null),
    ]);

    // Agora usamos apenas PDFDocument diretamente:
    const pdfFinal = await PDFDocument.create();

    if (capaBytes) {
      const capaDoc = await PDFDocument.load(capaBytes);
      const pages = await pdfFinal.copyPages(capaDoc, capaDoc.getPageIndices());
      pages.forEach((p: any) => pdfFinal.addPage(p));
    }

    const mioloDoc = await PDFDocument.load(miolo);
    const mioloPages = await pdfFinal.copyPages(mioloDoc, mioloDoc.getPageIndices());
    mioloPages.forEach((p: any) => pdfFinal.addPage(p));

    if (rodapeBytes) {
      const rodapeDoc = await PDFDocument.load(rodapeBytes);
      const rodapePages = await pdfFinal.copyPages(rodapeDoc, rodapeDoc.getPageIndices());
      rodapePages.forEach((p: any) => pdfFinal.addPage(p));
    }

    return pdfFinal.save();
  }
  // --- CRUD MÉTODOS ---
  async criar(dto: CreateOrcamentoDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.cliente_id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
return this.prisma.orcamentos.create({
  data: {
    cliente_id: cliente.id,
    cliente_nome_snapshot: cliente.nome_completo,
    cliente_cpf_snapshot: cliente.cpf || '',
    qtd_ambientes: 0, // ✅
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
      include: { cliente: true, itens: { orderBy: { id: 'asc' } }, arquivos: { orderBy: { id: 'desc' } } },
    });
    if (!orc) throw new NotFoundException('Orçamento não encontrado.');
    return orc;
  }

  async atualizar(id: number, dto: UpdateOrcamentoDto) {
    return this.prisma.orcamentos.update({ where: { id }, data: { cliente_nome_snapshot: dto.cliente_nome_snapshot, cliente_cpf_snapshot: dto.cliente_cpf_snapshot } });
  }

  async remover(id: number) {
    const dir = path.resolve(process.cwd(), 'uploads', 'orcamentos', String(id));
    await fs.rm(dir, { recursive: true, force: true }).catch(() => null);
    return this.prisma.orcamentos.delete({ where: { id } });
  }
async adicionarItem(orcamentoId: number, dto: CreateOrcamentoItemDto) {
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

  await this.atualizarQtdAmbientes(orcamentoId) // ✅

  return item
}


async atualizarItem(orcId: number, itemId: number, dto: UpdateOrcamentoItemDto) {
  const valor = dto.valor_unitario !== undefined ? Number(dto.valor_unitario || 0) : undefined

  return this.prisma.orcamento_itens.update({
    where: { id: itemId },
    data: {
      nome_ambiente: dto.nome_ambiente,
      descricao: dto.descricao,
      observacao: dto.observacao,
      valor_unitario: valor,
      valor_total: valor, // ✅ TRAVADO (segue unitário)
    },
  })
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


async removerItem(orcId: number, itemId: number) {
  await this.prisma.orcamento_itens.delete({
    where: { id: itemId },
  })

  await this.atualizarQtdAmbientes(orcId) // ✅
}

  async anexarArquivo(orcId: number, file: any) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    const pasta = path.resolve(process.cwd(), 'uploads', 'orcamentos', String(orcId));
    await fs.mkdir(pasta, { recursive: true });
    const nomeFinal = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const caminhoFinal = path.join(pasta, nomeFinal);
    await fs.writeFile(caminhoFinal, file.buffer);
    return this.prisma.orcamento_arquivos.create({ data: { orcamento_id: orcId, nome_original: file.originalname, mime_type: file.mimetype, tamanho: file.size, caminho: `uploads/orcamentos/${orcId}/${nomeFinal}` } });
  }

  async obterArquivo(orcId: number, arquivoId: number) {
    const arq = await this.prisma.orcamento_arquivos.findFirst({ where: { id: arquivoId, orcamento_id: orcId } });
    if (!arq) throw new NotFoundException('Arquivo não encontrado.');
    return { arq, abs: path.resolve(process.cwd(), arq.caminho) };
  }

  async listarArquivos(orcId: number) {
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