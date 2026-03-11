import { BadRequestException, Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
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
  async listar(filtros?: { produto_id?: number }) {
    const where: any = {};
    if (filtros?.produto_id) where.produto_id = Number(filtros.produto_id);
    return this.prisma.estoque_retalho.findMany({
      where,
      orderBy: { criado_em: 'desc' },
      include: {
        produto: { select: { id: true, nome_produto: true, cor: true, medida: true, unidade: true, imagem_url: true } },
        agenda_fabrica: { select: { id: true, titulo: true } },
      },
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
      },
      include: {
        produto: { select: { id: true, nome_produto: true } },
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
