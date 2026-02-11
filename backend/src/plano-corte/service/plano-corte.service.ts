import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PIPELINE_PLANO_CORTE_KEYS } from '../../shared/constantes/pipeline-plano-corte';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto';
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto';
import { randomBytes } from 'crypto';
import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class PlanoCorteService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeKey(value?: string | null) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  private resolveAgendaStatusFromPlanoStatus(status?: string | null) {
    const key = this.normalizeKey(status);
    if (key === 'FINALIZADO' || key === 'COMPENSADO') return 'CONCLUIDO';
    if (key === 'EM_PRODUCAO') return 'EM_ANDAMENTO';
    return 'PENDENTE';
  }

  private async syncAgendaFromPlanoCorte(
    tx: any,
    plano: {
      id: number;
      status: string;
      fornecedor_id: number;
      data_venda?: Date | string | null;
    },
  ) {
    const inicio = plano.data_venda ? new Date(plano.data_venda) : new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
    const statusKey = this.normalizeKey(plano.status);
    const statusLabel = statusKey.replace(/_/g, ' ').toLowerCase();

    await tx.agenda_global.upsert({
      where: { plano_corte_id: plano.id },
      create: {
        titulo: `Plano de Corte #${plano.id} - ${statusLabel}`,
        fornecedor_id: plano.fornecedor_id,
        plano_corte_id: plano.id,
        categoria: 'PRODUCAO',
        origem_fluxo: 'FORNECEDOR',
        inicio_em: inicio,
        fim_em: fim,
        status: this.resolveAgendaStatusFromPlanoStatus(plano.status),
      },
      update: {
        titulo: `Plano de Corte #${plano.id} - ${statusLabel}`,
        fornecedor_id: plano.fornecedor_id,
        categoria: 'PRODUCAO',
        origem_fluxo: 'FORNECEDOR',
        status: this.resolveAgendaStatusFromPlanoStatus(plano.status),
      },
    });
  }

  private brl(value: number) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private async gerarPdfBuffer(plano: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const left = 40;
    const right = doc.page.width - 40;

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#111');
    doc.text(`PLANO DE CORTE #${plano.id}`, left, doc.y);

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Fornecedor: ${plano.fornecedor?.razao_social || '-'}`, left);
    const dataVenda = plano.data_venda
      ? new Date(plano.data_venda).toLocaleDateString('pt-BR')
      : '-';
    doc.text(`Data do pedido: ${dataVenda}`, left);
    doc.text(`Status: ${plano.status || '-'}`, left);

    doc.moveDown(1);
    doc
      .lineWidth(0.5)
      .strokeColor('#E5E7EB')
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.moveDown(0.6);

    const colProduto = left;
    const colQtd = 320;
    const colUnit = 400;
    const colTotal = 480;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151');
    doc.text('PRODUTO', colProduto, doc.y);
    doc.text('QTD', colQtd, doc.y, { width: 70, align: 'right' });
    doc.text('VL. UNIT', colUnit, doc.y, { width: 70, align: 'right' });
    doc.text('TOTAL', colTotal, doc.y, { width: 70, align: 'right' });
    doc.moveDown(0.4);
    doc
      .lineWidth(0.2)
      .strokeColor('#E5E7EB')
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.moveDown(0.6);

    doc.font('Helvetica').fontSize(9).fillColor('#111');
    for (const item of plano.produtos || []) {
      const nome = item.item?.nome_produto || 'ITEM';
      const dimensao =
        item.largura_mm && item.comprimento_mm
          ? `${item.largura_mm}x${item.comprimento_mm}mm`
          : null;
      const esp = item.espessura_mm ? `${item.espessura_mm}mm` : null;
      const areaM2 =
        item.largura_mm && item.comprimento_mm
          ? (Number(item.largura_mm) / 1000) * (Number(item.comprimento_mm) / 1000)
          : null;
      const areaTxt = areaM2 ? `${areaM2.toFixed(3)} m2` : null;
      const precoM2Txt = item.preco_m2 ? `${this.brl(Number(item.preco_m2))}/m2` : null;
      const complemento = [
        item.item?.marca,
        item.item?.cor,
        item.item?.medida,
        dimensao,
        esp,
        areaTxt,
        precoM2Txt,
      ]
        .filter(Boolean)
        .join(' • ');
      const linha = complemento ? `${nome} (${complemento})` : nome;

      doc.text(linha, colProduto, doc.y, { width: 260 });
      doc.text(String(item.quantidade ?? 0), colQtd, doc.y, { width: 70, align: 'right' });
      doc.text(this.brl(Number(item.valor_unitario || 0)), colUnit, doc.y, { width: 70, align: 'right' });
      doc.text(this.brl(Number(item.valor_total || 0)), colTotal, doc.y, { width: 70, align: 'right' });
      doc.moveDown(0.6);
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }
    }

    doc.moveDown(0.5);
    doc
      .lineWidth(0.5)
      .strokeColor('#E5E7EB')
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke();
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111');
    doc.text(`TOTAL: ${this.brl(Number(plano.valor_total || 0))}`, left, doc.y, {
      width: right - left,
      align: 'right',
    });

    doc.end();
    return done;
  }

  async gerarPdfESalvar(planoId: number) {
    const plano = await this.findOne(planoId);
    const pdfBuffer = await this.gerarPdfBuffer(plano);

    const dir = path.join(process.cwd(), 'uploads', 'relatorios');
    await fs.mkdir(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = randomBytes(6).toString('hex');
    const filename = `plano_corte_${planoId}_${stamp}_${rand}.pdf`;

    await fs.writeFile(path.join(dir, filename), pdfBuffer);

    const url = `/uploads/relatorios/${filename}`;

    const arquivo = await this.prisma.arquivos.create({
      data: {
        owner_type: 'PLANO_CORTE',
        owner_id: planoId,
        categoria: 'RELATORIO',
        slot_key: null,
        url,
        filename,
        nome: `PLANO DE CORTE #${planoId}`,
        mime_type: 'application/pdf',
        tamanho: pdfBuffer.length,
      },
      select: { id: true },
    });

    return { arquivoId: arquivo.id };
  }

  async create(dto: CreatePlanoCorteDto) {
    if (!PIPELINE_PLANO_CORTE_KEYS.includes(dto.status)) {
      throw new BadRequestException(
        `Status invalido. Use: ${PIPELINE_PLANO_CORTE_KEYS.join(', ')}`,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const total = dto.produtos.reduce(
        (acc, p) => acc.plus(new Prisma.Decimal(p.valor_total || 0)),
        new Prisma.Decimal(0),
      );

      const plano = await tx.plano_corte.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: new Date(dto.data_venda),
          status: dto.status,
          valor_total: total,
        },
      });

      for (const p of dto.produtos) {
        await tx.plano_corte_produto.create({
          data: {
            plano_corte_id: plano.id,
            item_id: p.item_id,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.valor_total,
            status: p.status,
            largura_mm: p.largura_mm ?? null,
            comprimento_mm: p.comprimento_mm ?? null,
            espessura_mm: p.espessura_mm ?? null,
            preco_m2: p.preco_m2 ?? null,
          },
        });

        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: new Date(dto.data_venda),
          },
        });
      }

      await this.syncAgendaFromPlanoCorte(tx, {
        id: plano.id,
        status: plano.status,
        fornecedor_id: plano.fornecedor_id,
        data_venda: plano.data_venda,
      });

      return tx.plano_corte.findUnique({
        where: { id: plano.id },
        include: {
          fornecedor: true,
          produtos: { include: { item: true } },
          consumos: { include: { produto: true } },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.plano_corte.findMany({
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
      orderBy: { data_venda: 'desc' },
    });
  }

  async findOne(id: number) {
    const plano = await this.prisma.plano_corte.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
    });

    if (!plano)
      throw new NotFoundException(`Plano de Corte #${id} nao encontrado.`);
    return plano;
  }

  async update(id: number, dto: UpdatePlanoCorteDto) {
    await this.findOne(id);
    if (dto.status && !PIPELINE_PLANO_CORTE_KEYS.includes(dto.status)) {
      throw new BadRequestException(
        `Status invalido. Use: ${PIPELINE_PLANO_CORTE_KEYS.join(', ')}`,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.produtos) {
        await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } });

        for (const p of dto.produtos) {
          const qtd = new Prisma.Decimal(p.quantidade || 0);
          const vUnit = new Prisma.Decimal(p.valor_unitario || 0);
          const totalItem = qtd.mul(vUnit);

          await tx.plano_corte_produto.create({
            data: {
              plano_corte_id: id,
              item_id: p.item_id,
              quantidade: p.quantidade,
              valor_unitario: p.valor_unitario,
              valor_total: totalItem,
              status: p.status,
              largura_mm: p.largura_mm ?? null,
              comprimento_mm: p.comprimento_mm ?? null,
              espessura_mm: p.espessura_mm ?? null,
              preco_m2: p.preco_m2 ?? null,
            },
          });

          await tx.plano_corte_item.update({
            where: { id: p.item_id },
            data: {
              ultimo_valor_vendido: p.valor_unitario,
              ultimo_vendido_em: dto.data_venda ? new Date(dto.data_venda) : new Date(),
            },
          });
        }
      }

      const itensNoBanco = await tx.plano_corte_produto.findMany({
        where: { plano_corte_id: id },
      });

      const totalGeral = itensNoBanco.reduce(
        (acc, item) => acc.plus(new Prisma.Decimal(item.valor_total || 0)),
        new Prisma.Decimal(0),
      );

      await tx.plano_corte.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          status: dto.status,
          valor_total: totalGeral,
        },
      });

      const planoAtualizado = await tx.plano_corte.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          fornecedor_id: true,
          data_venda: true,
        },
      });

      if (planoAtualizado) {
        await this.syncAgendaFromPlanoCorte(tx, planoAtualizado);
      }

      return tx.plano_corte.findUnique({
        where: { id },
        include: {
          fornecedor: true,
          produtos: { include: { item: true } },
          consumos: { include: { produto: true } },
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.plano_corte_consumo.deleteMany({ where: { plano_corte_id: id } });
      await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } });
      await tx.plano_corte.delete({ where: { id } });
      return { ok: true };
    });
  }
}
