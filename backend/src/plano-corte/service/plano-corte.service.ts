import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Status aceitos (mesmos da agenda de produção). Inclui legados para compatibilidade. */
const STATUS_PLANO_CORTE_ACEITOS = [
  'PRODUCAO_RECEBIDA',
  'CORTE',
  'PRODUCAO_FINALIZADA',
  'RECEBIDO',
  'CONFERIDO_TECNICO',
  'NA_MAQUINA',
  'BORDA_E_ACABAMENTO',
  'PRONTO_PARA_RETIRADA',
  'ENTREGUE',
];
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto';
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto';
import { randomBytes } from 'crypto';
import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import * as path from 'path';
import { renderHeaderDocumento } from '../../pdf/header-documento';

@Injectable()
export class PlanoCorteService {
  constructor(private readonly prisma: PrismaService) {}

  private brl(value: number) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private async gerarPdfBuffer(plano: any): Promise<Buffer> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: 1 },
    });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const margin = 40;
    const left = margin;
    const right = doc.page.width - margin;
    const contentWidth = right - left;

    // Cabeçalho: logo (se existir) + dados da empresa + título "PLANO DE CORTE #N"
    let y = renderHeaderDocumento(
      doc,
      empresa,
      `PLANO DE CORTE #${plano.id}`,
      { margin },
    );

    // Bloco de informações do pedido (card)
    const cardPadding = 12;
    const cardTop = y;
    doc.rect(left, cardTop, contentWidth, 52)
      .fillAndStroke('#f8fafc', '#e2e8f0');
    y = cardTop + cardPadding;

    doc.font('Helvetica').fontSize(9).fillColor('#64748b');
    doc.text('Fornecedor', left + cardPadding, y);
    doc.text('Data do pedido', left + cardPadding + 200, y);
    doc.text('Status', left + cardPadding + 380, y);
    y += 12;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e293b');
    doc.text(plano.fornecedor?.razao_social || '—', left + cardPadding, y, { width: 180 });
    const dataVenda = plano.data_venda
      ? new Date(plano.data_venda).toLocaleDateString('pt-BR')
      : '—';
    doc.font('Helvetica').text(dataVenda, left + cardPadding + 200, y);
    doc.text(String(plano.status || '—'), left + cardPadding + 380, y, { width: 120 });
    y = cardTop + 52 + 14;

    // Tabela de produtos
    const colProduto = left;
    const colQtd = 320;
    const colUnit = 400;
    const colTotal = 480;
    const rowHeight = 22;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151');
    doc.text('PRODUTO', colProduto, y);
    doc.text('QTD', colQtd, y, { width: 70, align: 'right' });
    doc.text('VL. UNIT', colUnit, y, { width: 70, align: 'right' });
    doc.text('TOTAL', colTotal, y, { width: 70, align: 'right' });
    y += 10;
    doc
      .lineWidth(0.5)
      .strokeColor('#e2e8f0')
      .moveTo(left, y)
      .lineTo(right, y)
      .stroke();
    y += 10;

    const produtos = plano.produtos || [];
    doc.font('Helvetica').fontSize(9);
    for (let i = 0; i < produtos.length; i++) {
      const item = produtos[i];
      if (y > doc.page.height - 70) {
        doc.addPage();
        y = margin;
      }
      // Linha zebrada
      if (i % 2 === 1) {
        doc.rect(left, y - 2, contentWidth, rowHeight + 4).fill('#f8fafc');
      }
      const nome = item.item?.nome_produto || 'ITEM';
      const dimensao =
        item.largura_mm && item.comprimento_mm
          ? `${item.largura_mm}x${item.comprimento_mm}mm`
          : null;
      const esp = item.espessura_mm ? `${item.espessura_mm}mm` : null;
      const areaM2 =
        item.largura_mm && item.comprimento_mm
          ? (Number(item.largura_mm) / 1000) *
            (Number(item.comprimento_mm) / 1000)
          : null;
      const areaTxt = areaM2 ? `${areaM2.toFixed(3)} m²` : null;
      const precoM2Txt = item.preco_m2
        ? `${this.brl(Number(item.preco_m2))}/m²`
        : null;
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

      doc.fillColor('#1e293b');
      doc.text(linha, colProduto, y, { width: 260 });
      doc.text(String(item.quantidade ?? 0), colQtd, y, {
        width: 70,
        align: 'right',
      });
      doc.text(this.brl(Number(item.valor_unitario || 0)), colUnit, y, {
        width: 70,
        align: 'right',
      });
      doc.text(this.brl(Number(item.valor_total || 0)), colTotal, y, {
        width: 70,
        align: 'right',
      });
      y += rowHeight;
    }

    y += 8;
    doc
      .lineWidth(0.5)
      .strokeColor('#e2e8f0')
      .moveTo(left, y)
      .lineTo(right, y)
      .stroke();
    y += 12;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b');
    doc.text(
      `TOTAL: ${this.brl(Number(plano.valor_total || 0))}`,
      left,
      y,
      {
        width: contentWidth,
        align: 'right',
      },
    );

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

  /** Valida fornecedor e itens antes de criar/atualizar (evita erro interno quando dados já existem no banco ou referências quebradas). */
  private async validarFornecedorEItens(
    fornecedor_id: number,
    produtos: { item_id: number }[],
  ): Promise<void> {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedor_id },
      select: { id: true },
    });
    if (!fornecedor) {
      throw new BadRequestException('Fornecedor não encontrado. Verifique se o cadastro ainda existe.');
    }
    const itemIds = [...new Set(produtos.map((p) => p.item_id))];
    const itens = await this.prisma.plano_corte_item.findMany({
      where: { id: { in: itemIds }, fornecedor_id },
      select: { id: true },
    });
    const idsEncontrados = new Set(itens.map((i) => i.id));
    const faltando = itemIds.filter((id) => !idsEncontrados.has(id));
    if (faltando.length > 0) {
      throw new BadRequestException(
        `Item(s) de corte não encontrado(s) ou não pertencem a este fornecedor (IDs: ${faltando.join(', ')}). Cadastre os itens em Serviço de Corte → Itens ou verifique se não foram excluídos.`,
      );
    }
  }

  async create(dto: CreatePlanoCorteDto, opts?: { criadoPorUsuarioId?: number }) {
    const statusNorm = String(dto.status || '').trim().toUpperCase();
    if (!statusNorm || !STATUS_PLANO_CORTE_ACEITOS.includes(statusNorm)) {
      throw new BadRequestException(
        `Status inválido. Use: ${STATUS_PLANO_CORTE_ACEITOS.slice(0, 3).join(', ')}`,
      );
    }
    await this.validarFornecedorEItens(dto.fornecedor_id, dto.produtos);
    try {
      return await this.prisma.$transaction(async (tx) => {
      // soma com Decimal (evita ruído de float)
      const total = dto.produtos.reduce(
        (acc, p) => acc.plus(new Prisma.Decimal(p.valor_total || 0)),
        new Prisma.Decimal(0),
      );

      const plano = await tx.plano_corte.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: new Date(dto.data_venda),
          status: statusNorm,
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

        // atualiza histórico do item vendido (campos já existem no schema)
        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: new Date(dto.data_venda),
          },
        });
      }

      // Evento isolado na agenda da produção: sem cliente_id (não reflete no acompanhar status), sem prazo de execução
      const agendaExistente = await tx.agenda_fabrica.findFirst({
        where: { plano_corte_id: plano.id, status: { not: 'CANCELADO' } },
        select: { id: true },
      });
      if (!agendaExistente) {
        const inicio = new Date();
        const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
        const criadoPor = opts?.criadoPorUsuarioId != null && Number.isFinite(opts.criadoPorUsuarioId)
          ? { criado_por_usuario_id: opts.criadoPorUsuarioId }
          : {};
        await tx.agenda_fabrica.create({
          data: {
            titulo: `Serviço de Corte #${plano.id}`,
            inicio_em: inicio,
            fim_em: fim,
            categoria: 'PRODUCAO_RECEBIDA',
            origem_fluxo: 'PLANO_CORTE',
            status: 'PENDENTE',
            plano_corte_id: plano.id,
            ...criadoPor,
          },
        });
      }

      return tx.plano_corte.findUnique({
        where: { id: plano.id },
        include: {
          fornecedor: true,
          produtos: { include: { item: true } },
          consumos: { include: { produto: true } },
        },
      });
    });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new BadRequestException(
            'Item de corte não encontrado. Verifique se os itens ainda existem em Serviço de Corte → Itens.',
          );
        }
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'Já existe um agendamento para este plano de corte.',
          );
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Referência inválida (fornecedor ou item não existe). Verifique os cadastros.',
          );
        }
      }
      throw e;
    }
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
      throw new NotFoundException(`Plano de Corte #${id} não encontrado.`);
    return plano;
  }

  async update(id: number, dto: UpdatePlanoCorteDto, opts?: { criadoPorUsuarioId?: number }) {
    const plano = await this.findOne(id);
    const statusNorm = dto.status
      ? String(dto.status).trim().toUpperCase()
      : null;
    if (statusNorm && !STATUS_PLANO_CORTE_ACEITOS.includes(statusNorm)) {
      throw new BadRequestException(
        `Status inválido. Use: ${STATUS_PLANO_CORTE_ACEITOS.slice(0, 3).join(', ')}`,
      );
    }
    const fornecedorId = dto.fornecedor_id ?? plano.fornecedor_id;
    if (dto.produtos?.length) {
      await this.validarFornecedorEItens(fornecedorId, dto.produtos);
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
      // 1. Se houver produtos no DTO, atualizamos a lista
      if (dto.produtos) {
        // Remove os itens antigos para evitar duplicidade ou lixo
        await tx.plano_corte_produto.deleteMany({
          where: { plano_corte_id: id },
        });

        for (const p of dto.produtos) {
          // FORÇAMOS O CÁLCULO AQUI: Quantidade * Valor Unitário
          // Isso ignora se o frontend mandou o p.valor_total errado
          const qtd = new Prisma.Decimal(p.quantidade || 0);
          const vUnit = new Prisma.Decimal(p.valor_unitario || 0);
          const totalItem = qtd.mul(vUnit);

          await tx.plano_corte_produto.create({
            data: {
              plano_corte_id: id,
              item_id: p.item_id,
              quantidade: p.quantidade,
              valor_unitario: p.valor_unitario,
              valor_total: totalItem, // Salva o cálculo feito pelo servidor
              status: p.status,
              largura_mm: p.largura_mm ?? null,
              comprimento_mm: p.comprimento_mm ?? null,
              espessura_mm: p.espessura_mm ?? null,
              preco_m2: p.preco_m2 ?? null,
            },
          });

          // Atualiza o histórico do item
          await tx.plano_corte_item.update({
            where: { id: p.item_id },
            data: {
              ultimo_valor_vendido: p.valor_unitario,
              ultimo_vendido_em: dto.data_venda
                ? new Date(dto.data_venda)
                : new Date(),
            },
          });
        }
      }

      // 2. RECALCULO DO CABEÇALHO (O PONTO CHAVE)
      // Buscamos o que está no banco agora para somar o total real
      const itensNoBanco = await tx.plano_corte_produto.findMany({
        where: { plano_corte_id: id },
      });

      const totalGeral = itensNoBanco.reduce(
        (acc, item) => acc.plus(new Prisma.Decimal(item.valor_total || 0)),
        new Prisma.Decimal(0),
      );

      // 3. ATUALIZA O CABEÇALHO SEMPRE
      await tx.plano_corte.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          ...(statusNorm && { status: statusNorm }),
          valor_total: totalGeral, // Aqui o valor 1,74 vira 17,40 automaticamente
        },
      });

      // 4. Evento isolado na agenda da produção: ao salvar, abre evento na agenda; sem cliente_id (não reflete no acompanhar status), sem prazo
      const agendaExistente = await tx.agenda_fabrica.findFirst({
        where: { plano_corte_id: id, status: { not: 'CANCELADO' } },
        select: { id: true },
      });
      if (!agendaExistente) {
        const inicio = new Date();
        const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
        const criadoPor = opts?.criadoPorUsuarioId != null && Number.isFinite(opts.criadoPorUsuarioId)
          ? { criado_por_usuario_id: opts.criadoPorUsuarioId }
          : {};
        await tx.agenda_fabrica.create({
          data: {
            titulo: `Serviço de Corte #${id}`,
            inicio_em: inicio,
            fim_em: fim,
            categoria: 'PRODUCAO_RECEBIDA',
            origem_fluxo: 'PLANO_CORTE',
            status: 'PENDENTE',
            plano_corte_id: id,
            ...criadoPor,
          },
        });
      }

      // Retorna o plano atualizado com todas as relações
      return tx.plano_corte.findUnique({
        where: { id },
        include: {
          fornecedor: true,
          produtos: { include: { item: true } },
          consumos: { include: { produto: true } },
        },
      });
    });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new BadRequestException(
            'Item de corte não encontrado. Verifique se os itens ainda existem em Serviço de Corte → Itens.',
          );
        }
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'Já existe um agendamento para este plano de corte.',
          );
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Referência inválida (fornecedor ou item não existe). Verifique os cadastros.',
          );
        }
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // garante remoção sem depender de cascata
      await tx.plano_corte_consumo.deleteMany({
        where: { plano_corte_id: id },
      });
      await tx.plano_corte_produto.deleteMany({
        where: { plano_corte_id: id },
      });
      await tx.plano_corte.delete({ where: { id } });
      return { ok: true };
    });
  }
}
