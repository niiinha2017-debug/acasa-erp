import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { mm } from '../pdf/units';
import type { PecaPromobDto } from './dto/find-scrap-matches.dto';

/** Retorno de uma peça após verificação de retalhos */
export interface PecaComRetalho {
  produto_id: number;
  largura_mm: number;
  comprimento_mm: number;
  valor_total: number;
  id_ref?: string | number;
  /** Se encontrou retalho compatível */
  usar_retalho_id?: number;
  /** Mensagem para exibição: "Usar Retalho ID: XXX" */
  mensagem?: string;
}

/** Resultado de findScrapMatches */
export interface FindScrapMatchesResult {
  pecas: PecaComRetalho[];
  /** Soma do valor_total das peças que têm retalho (a subtrair do custo de materiais) */
  economia_total: number;
  /** Quantidade de peças que receberam indicação de retalho */
  pecas_com_retalho: number;
}

@Injectable()
export class EstoqueRetalhoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista retalhos (sobras) de um produto.
   */
  async listarPorProduto(produtoId: number) {
    const id = Number(produtoId);
    if (!id) throw new BadRequestException('produto_id inválido.');
    return this.prisma.estoque_retalho.findMany({
      where: { produto_id: id },
      orderBy: { criado_em: 'desc' },
      include: {
        produto: { select: { id: true, nome_produto: true, unidade: true, imagem_url: true } },
        agenda_fabrica: { select: { id: true, titulo: true } },
      },
    });
  }

  /**
   * Lista todos os retalhos (para tela de gestão).
   */
  async listar(filtros?: { produto_id?: number; status?: string }) {
    const where: any = {};
    if (filtros?.produto_id) where.produto_id = Number(filtros.produto_id);
    if (filtros?.status) where.status = filtros.status;
    return this.prisma.estoque_retalho.findMany({
      where,
      orderBy: { criado_em: 'desc' },
      include: {
        produto: { select: { id: true, nome_produto: true, cor: true, medida: true, unidade: true, imagem_url: true, marca: true, espessura_mm: true } },
        agenda_fabrica: { select: { id: true, titulo: true } },
      },
    });
  }

  /**
   * Busca um retalho pelo ID.
   */
  async buscarPorId(id: number) {
    const registro = await this.prisma.estoque_retalho.findUnique({
      where: { id: Number(id) },
      include: {
        produto: { select: { id: true, nome_produto: true, cor: true, medida: true, unidade: true, imagem_url: true, marca: true, espessura_mm: true, largura_mm: true, comprimento_mm: true } },
        agenda_fabrica: { select: { id: true, titulo: true } },
      },
    });
    if (!registro) throw new NotFoundException(`Retalho #${id} não encontrado.`);
    return registro;
  }

  /**
   * Atualiza um retalho (sobra).
   */
  async atualizar(
    id: number,
    dto: {
      largura_mm?: number;
      comprimento_mm?: number;
      status?: string;
      imagem_url?: string;
      observacao?: string;
    },
  ) {
    const existing = await this.prisma.estoque_retalho.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Retalho #${id} não encontrado.`);

    const data: any = {};
    if (dto.largura_mm !== undefined) data.largura_mm = Number(dto.largura_mm);
    if (dto.comprimento_mm !== undefined) data.comprimento_mm = Number(dto.comprimento_mm);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.imagem_url !== undefined) data.imagem_url = dto.imagem_url;
    if (dto.observacao !== undefined) data.observacao = dto.observacao;

    const largura = data.largura_mm ?? existing.largura_mm;
    const comprimento = data.comprimento_mm ?? existing.comprimento_mm;
    if (data.largura_mm !== undefined || data.comprimento_mm !== undefined) {
      data.quantidade_m2 = new Decimal((largura * comprimento) / 1_000_000);
    }

    return this.prisma.estoque_retalho.update({
      where: { id: Number(id) },
      data,
      include: {
        produto: { select: { id: true, nome_produto: true, cor: true, medida: true } },
      },
    });
  }

  /**
   * Remove um retalho (sobra).
   */
  async remover(id: number) {
    const existing = await this.prisma.estoque_retalho.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException(`Retalho #${id} não encontrado.`);
    await this.prisma.estoque_retalho.delete({ where: { id: Number(id) } });
    return { message: 'Retalho removido com sucesso.' };
  }

  /**
   * Gera PDF de etiqueta para um retalho (sobra).
   * Formato: 100mm x 60mm – dados do material, dimensões, QR-like ID, data.
   */
  async gerarEtiqueta(id: number): Promise<Buffer> {
    const retalho = await this.buscarPorId(id);
    const produto = retalho.produto;
    const areaM2 = Number(retalho.quantidade_m2 || 0).toFixed(4);
    const dataCriacao = retalho.criado_em
      ? new Date(retalho.criado_em).toLocaleDateString('pt-BR')
      : '—';

    const pageW = mm(100);
    const pageH = mm(60);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: [pageW, pageH],
        margins: { top: mm(4), bottom: mm(4), left: mm(5), right: mm(5) },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const leftX = mm(5);

      // Título
      doc.font('Helvetica-Bold').fontSize(11).text('SOBRA / RETALHO', leftX, mm(5), { width: pageW - mm(10), align: 'center' });

      // Linha separadora
      doc.moveTo(leftX, mm(12)).lineTo(pageW - mm(5), mm(12)).lineWidth(0.5).stroke();

      // ID grande
      doc.font('Helvetica-Bold').fontSize(22).text(`#${retalho.id}`, leftX, mm(14), { width: pageW - mm(10), align: 'center' });

      // Material
      const infoY = mm(26);
      doc.font('Helvetica-Bold').fontSize(7).text('Material:', leftX, infoY);
      doc.font('Helvetica').fontSize(7).text(produto?.nome_produto || '—', leftX + mm(18), infoY, { width: mm(72) });

      // Cor
      doc.font('Helvetica-Bold').fontSize(7).text('Cor:', leftX, infoY + mm(5));
      doc.font('Helvetica').fontSize(7).text(produto?.cor || '—', leftX + mm(18), infoY + mm(5));

      // Dimensões
      doc.font('Helvetica-Bold').fontSize(7).text('Dimensões:', leftX, infoY + mm(10));
      doc.font('Helvetica').fontSize(7).text(`${retalho.largura_mm} × ${retalho.comprimento_mm} mm`, leftX + mm(18), infoY + mm(10));

      // Área
      doc.font('Helvetica-Bold').fontSize(7).text('Área:', leftX, infoY + mm(15));
      doc.font('Helvetica').fontSize(7).text(`${areaM2} m²`, leftX + mm(18), infoY + mm(15));

      // Data e Status (lado direito)
      doc.font('Helvetica-Bold').fontSize(7).text('Data:', leftX + mm(50), infoY + mm(10));
      doc.font('Helvetica').fontSize(7).text(dataCriacao, leftX + mm(60), infoY + mm(10));

      doc.font('Helvetica-Bold').fontSize(7).text('Status:', leftX + mm(50), infoY + mm(15));
      doc.font('Helvetica').fontSize(7).text(retalho.status || 'DISPONIVEL', leftX + mm(60), infoY + mm(15));

      // Linha inferior
      doc.moveTo(leftX, mm(52)).lineTo(pageW - mm(5), mm(52)).lineWidth(0.5).stroke();

      // Rodapé
      doc.font('Helvetica').fontSize(5).fillColor('#888').text('A Casa — Estoque de Sobras', leftX, mm(54), { width: pageW - mm(10), align: 'center' });

      doc.end();
    });
  }

  /**
   * Registra uma sobra (retalho) vinculada ao material original.
   * quantidade_m2 = (largura_mm * comprimento_mm) / 1_000_000
   */
  async criar(dto: {
    produto_id: number;
    agenda_fabrica_id?: number | null;
    largura_mm: number;
    comprimento_mm: number;
  }) {
    const produto_id = Number(dto.produto_id);
    const largura_mm = Number(dto.largura_mm) || 0;
    const comprimento_mm = Number(dto.comprimento_mm) || 0;
    if (!produto_id || largura_mm <= 0 || comprimento_mm <= 0) {
      throw new BadRequestException('produto_id, largura_mm e comprimento_mm são obrigatórios e devem ser > 0.');
    }
    const quantidade_m2 = new Decimal((largura_mm * comprimento_mm) / 1_000_000);
    return this.prisma.estoque_retalho.create({
      data: {
        produto_id,
        agenda_fabrica_id: dto.agenda_fabrica_id ?? undefined,
        largura_mm,
        comprimento_mm,
        quantidade_m2,
        imagem_url: (dto as any).imagem_url ?? undefined,
        observacao: (dto as any).observacao ?? undefined,
      },
      include: {
        produto: { select: { id: true, nome_produto: true, cor: true, medida: true } },
      },
    });
  }

  /**
   * Cria múltiplos retalhos (ex.: ao concluir tarefa no Totem).
   */
  async criarVarios(
    itens: Array<{ produto_id: number; largura_mm: number; comprimento_mm: number }>,
    agenda_fabrica_id?: number | null,
  ) {
    if (!itens?.length) return [];
    const criados = [];
    for (const item of itens) {
      if (!item.produto_id || !item.largura_mm || !item.comprimento_mm) continue;
      const r = await this.criar({
        produto_id: item.produto_id,
        agenda_fabrica_id,
        largura_mm: Number(item.largura_mm),
        comprimento_mm: Number(item.comprimento_mm),
      });
      criados.push(r);
    }
    return criados;
  }

  /**
   * Compara a lista de peças do Promob com a tabela de Retalhos.
   * Se encontrar retalho do mesmo material e maior que a peça necessária, marca a peça com "Usar Retalho ID: XXX".
   * Retorna a economia total (valor das peças cobertas por retalho) para subtrair do custo de materiais e aumentar a margem real.
   */
  async findScrapMatches(pecas: PecaPromobDto[]): Promise<FindScrapMatchesResult> {
    if (!pecas?.length) {
      return { pecas: [], economia_total: 0, pecas_com_retalho: 0 };
    }

    const produtoIds = [...new Set(pecas.map((p) => Number(p.produto_id)).filter(Boolean))];
    if (!produtoIds.length) {
      return {
        pecas: pecas.map((p) => ({
          ...p,
          valor_total: Number(p.valor_total) || 0,
        })),
        economia_total: 0,
        pecas_com_retalho: 0,
      };
    }

    const retalhos = await this.prisma.estoque_retalho.findMany({
      where: { produto_id: { in: produtoIds } },
      orderBy: [{ quantidade_m2: 'asc' }],
    });

    const toNum = (v: unknown): number =>
      typeof v === 'number' && !Number.isNaN(v) ? v : Number(Decimal.isDecimal(v) ? (v as Decimal).toNumber() : v) || 0;

    /** Retalhos já atribuídos nesta execução (um retalho por peça) */
    const retalhoUsado = new Set<number>();
    const resultado: PecaComRetalho[] = [];
    let economia_total = 0;

    for (const peca of pecas) {
      const produto_id = Number(peca.produto_id);
      const largura_mm = Number(peca.largura_mm) || 0;
      const comprimento_mm = Number(peca.comprimento_mm) || 0;
      const valor_total = toNum(peca.valor_total);

      const item: PecaComRetalho = {
        produto_id,
        largura_mm,
        comprimento_mm,
        valor_total,
        id_ref: peca.id_ref,
      };

      const candidatos = retalhos.filter(
        (r) =>
          r.produto_id === produto_id &&
          !retalhoUsado.has(r.id) &&
          this.retalhoCobrePeca(
            toNum(r.largura_mm),
            toNum(r.comprimento_mm),
            largura_mm,
            comprimento_mm,
          ),
      );

      const escolhido = candidatos[0];
      if (escolhido) {
        retalhoUsado.add(escolhido.id);
        item.usar_retalho_id = escolhido.id;
        item.mensagem = `Usar Retalho ID: ${escolhido.id}`;
        economia_total += valor_total;
      }

      resultado.push(item);
    }

    return {
      pecas: resultado,
      economia_total: Math.round(economia_total * 100) / 100,
      pecas_com_retalho: retalhoUsado.size,
    };
  }

  /**
   * Verifica se um retalho (largura x comprimento) cobre a peça necessária.
   * Considera rotação: a peça pode ser colocada em 0° ou 90°.
   */
  private retalhoCobrePeca(
    retLargura: number,
    retComprimento: number,
    pecaLargura: number,
    pecaComprimento: number,
  ): boolean {
    if (pecaLargura <= 0 || pecaComprimento <= 0) return false;
    const cabeSemRotacao = retLargura >= pecaLargura && retComprimento >= pecaComprimento;
    const cabeComRotacao = retLargura >= pecaComprimento && retComprimento >= pecaLargura;
    return cabeSemRotacao || cabeComRotacao;
  }
}
