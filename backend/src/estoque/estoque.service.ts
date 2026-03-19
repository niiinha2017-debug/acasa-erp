import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ConsultaDisponibilidadeParams = {
  produto_id?: number;
  venda_id?: number;
};

type EntradaManualDto = {
  produto_id: number;
  quantidade_chapas: number;
  fornecedor_nome?: string;
  lote?: string;
  observacao?: string;
};

type EntradaNfDto = {
  numero_nf: string;
  fornecedor_nome?: string;
  observacao?: string;
  itens: Array<{
    produto_id: number;
    quantidade_chapas: number;
    lote?: string;
    observacao?: string;
  }>;
};

type ReservaPecaDto = {
  largura_mm: number;
  comprimento_mm: number;
  id_ref?: string | number;
};

type ReservaConsumoDto = {
  produto_id: number;
  quantidade_chapas?: number;
  pecas?: ReservaPecaDto[];
};

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  private getPrismaDelegate(client: any, delegateName: string) {
    const delegate = client?.[delegateName];
    if (delegate) return delegate;

    throw new InternalServerErrorException(
      `Prisma Client sem o delegate ${delegateName}. Execute "npm run db:generate" no backend para sincronizar o schema.`,
    );
  }

  private getEstoqueChapaInteiraDelegate(client: any) {
    return this.getPrismaDelegate(client, 'estoque_chapa_inteira');
  }

  private getEstoqueRetalhoDelegate(client: any) {
    return this.getPrismaDelegate(client, 'estoque_retalho');
  }

  private toInt(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }

  private toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  async consultarDisponibilidade(params: ConsultaDisponibilidadeParams) {
    const produtoId = this.toInt(params.produto_id);
    const whereProduto = produtoId > 0 ? { produto_id: produtoId } : {};
    const estoqueChapaInteira = this.getEstoqueChapaInteiraDelegate(this.prisma);
    const estoqueRetalho = this.getEstoqueRetalhoDelegate(this.prisma);

    const [
      chapasDisponiveis,
      chapasReservadas,
      retalhosDisponiveis,
      retalhosReservados,
      porProdutoChapas,
      porProdutoRetalhos,
    ] = await Promise.all([
      estoqueChapaInteira.aggregate({
        where: { ...whereProduto, status: 'DISPONIVEL' },
        _sum: { quantidade_disponivel: true },
      }),
      estoqueChapaInteira.count({
        where: {
          ...whereProduto,
          status: 'RESERVADO',
          ...(params.venda_id ? { reservado_para_tipo: 'VENDA', reservado_para_id: this.toInt(params.venda_id) } : {}),
        },
      }),
      estoqueRetalho.aggregate({
        where: { ...whereProduto, status: 'DISPONIVEL' },
        _sum: { quantidade_m2: true },
      }),
      estoqueRetalho.count({
        where: {
          ...whereProduto,
          status: 'RESERVADO',
          ...(params.venda_id ? { reservado_para_tipo: 'VENDA', reservado_para_id: this.toInt(params.venda_id) } : {}),
        },
      }),
      estoqueChapaInteira.groupBy({
        by: ['produto_id'],
        where: { ...whereProduto, status: 'DISPONIVEL' },
        _sum: { quantidade_disponivel: true },
        orderBy: { produto_id: 'asc' },
      }),
      estoqueRetalho.groupBy({
        by: ['produto_id'],
        where: { ...whereProduto, status: 'DISPONIVEL' },
        _sum: { quantidade_m2: true },
        orderBy: { produto_id: 'asc' },
      }),
    ]);

    return {
      resumo: {
        chapas_disponiveis: Number(chapasDisponiveis?._sum?.quantidade_disponivel || 0),
        chapas_reservadas_registros: Number(chapasReservadas || 0),
        retalhos_disponiveis_m2: Number(retalhosDisponiveis?._sum?.quantidade_m2 || 0),
        retalhos_reservados_registros: Number(retalhosReservados || 0),
      },
      por_produto: {
        chapas: (porProdutoChapas || []).map((r: any) => ({
          produto_id: Number(r.produto_id),
          quantidade_disponivel: Number(r?._sum?.quantidade_disponivel || 0),
        })),
        retalhos: (porProdutoRetalhos || []).map((r: any) => ({
          produto_id: Number(r.produto_id),
          area_disponivel_m2: Number(r?._sum?.quantidade_m2 || 0),
        })),
      },
    };
  }

  async darEntradaManual(dto: EntradaManualDto) {
    const produtoId = this.toInt(dto.produto_id);
    const quantidade = this.toInt(dto.quantidade_chapas);
    if (produtoId <= 0 || quantidade <= 0) {
      throw new BadRequestException('produto_id e quantidade_chapas devem ser maiores que zero.');
    }

    const estoqueChapaInteira = this.getEstoqueChapaInteiraDelegate(this.prisma);
    return estoqueChapaInteira.create({
      data: {
        produto_id: produtoId,
        origem_entrada: 'MANUAL',
        fornecedor_nome: dto.fornecedor_nome ? String(dto.fornecedor_nome).trim() : null,
        lote: dto.lote ? String(dto.lote).trim() : null,
        quantidade_total: quantidade,
        quantidade_disponivel: quantidade,
        status: 'DISPONIVEL',
        observacao: dto.observacao ? String(dto.observacao).trim() : null,
      },
      include: {
        produto: { select: { id: true, nome_produto: true, cor: true, medida: true, unidade: true } },
      },
    });
  }

  async darEntradaPorNf(dto: EntradaNfDto) {
    const numeroNf = String(dto?.numero_nf || '').trim();
    if (!numeroNf) throw new BadRequestException('numero_nf é obrigatório.');
    if (!Array.isArray(dto?.itens) || dto.itens.length === 0) {
      throw new BadRequestException('Informe ao menos 1 item para a NF.');
    }

    const itensValidos = dto.itens
      .map((item) => ({
        produto_id: this.toInt(item.produto_id),
        quantidade_chapas: this.toInt(item.quantidade_chapas),
        lote: item.lote ? String(item.lote).trim() : null,
        observacao: item.observacao ? String(item.observacao).trim() : null,
      }))
      .filter((item) => item.produto_id > 0 && item.quantidade_chapas > 0);

    if (!itensValidos.length) {
      throw new BadRequestException('Nenhum item válido na NF (produto_id/quantidade_chapas).');
    }

    const estoqueChapaInteira = this.getEstoqueChapaInteiraDelegate(this.prisma);
    const fornecedorNome = dto.fornecedor_nome ? String(dto.fornecedor_nome).trim() : null;
    const observacaoNf = dto.observacao ? String(dto.observacao).trim() : null;

    const criados = await this.prisma.$transaction(
      itensValidos.map((item) =>
        estoqueChapaInteira.create({
          data: {
            produto_id: item.produto_id,
            origem_entrada: 'NF',
            numero_nf: numeroNf,
            fornecedor_nome: fornecedorNome,
            lote: item.lote,
            quantidade_total: item.quantidade_chapas,
            quantidade_disponivel: item.quantidade_chapas,
            status: 'DISPONIVEL',
            observacao: item.observacao || observacaoNf,
          },
        }),
      ),
    );

    return {
      numero_nf: numeroNf,
      total_registros: criados.length,
      total_chapas: criados.reduce((acc: number, item: any) => acc + Number(item.quantidade_total || 0), 0),
    };
  }

  async reservarParaVenda(
    vendaId: number,
    dto: { projeto_nome?: string; consumo?: ReservaConsumoDto[] },
  ) {
    const idVenda = this.toInt(vendaId);
    if (idVenda <= 0) throw new BadRequestException('vendaId inválido.');

    const consumo = Array.isArray(dto?.consumo) ? dto.consumo : [];
    const projetoNome = String(dto?.projeto_nome || `Projeto da venda #${idVenda}`).trim();

    const consumoFinal = consumo.length > 0 ? consumo : await this.consumoAutomaticoPorPlanoDaVenda(idVenda);
    if (!consumoFinal.length) {
      return {
        venda_id: idVenda,
        projeto_nome: projetoNome,
        reservado: false,
        motivo: 'Sem consumo informado e sem plano de corte vinculado à venda.',
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const chapas = await this.reservarChapasInteiras(tx as any, {
        consumo: consumoFinal,
        reservado_para_tipo: 'VENDA',
        reservado_para_id: idVenda,
        reservado_para_ref: projetoNome,
      });

      const retalhos = await this.reservarRetalhosCompativeis(tx as any, {
        consumo: consumoFinal,
        reservado_para_tipo: 'VENDA',
        reservado_para_id: idVenda,
        reservado_para_ref: projetoNome,
      });

      return {
        venda_id: idVenda,
        projeto_nome: projetoNome,
        reservado: chapas.qtd_reservada > 0 || retalhos.qtd_reservada > 0,
        chapas_inteiras: chapas,
        retalhos: retalhos,
      };
    });
  }

  async reservarAutomaticoPorVendaFechada(vendaId: number) {
    const idVenda = this.toInt(vendaId);
    if (idVenda <= 0) return { reservado: false, motivo: 'Venda inválida.' };

    const consumoAuto = await this.consumoAutomaticoPorPlanoDaVenda(idVenda);
    if (!consumoAuto.length) {
      return {
        reservado: false,
        motivo: 'Venda fechada sem plano de corte vinculado para reserva automática.',
      };
    }

    return this.reservarParaVenda(idVenda, {
      projeto_nome: `Projeto da venda #${idVenda}`,
      consumo: consumoAuto,
    });
  }

  private async consumoAutomaticoPorPlanoDaVenda(vendaId: number): Promise<ReservaConsumoDto[]> {
    const agenda = await this.prisma.agenda_fabrica.findFirst({
      where: {
        venda_id: vendaId,
        plano_corte_id: { not: null },
        status: { not: 'CANCELADO' },
      },
      orderBy: { id: 'desc' },
      select: { plano_corte_id: true },
    });

    if (!agenda?.plano_corte_id) return [];

    const consumos = await this.prisma.plano_corte_consumo.findMany({
      where: { plano_corte_id: agenda.plano_corte_id },
      select: { produto_id: true, quantidade: true },
    });

    return (consumos || [])
      .map((c) => ({
        produto_id: this.toInt(c.produto_id),
        quantidade_chapas: Math.max(0, Math.ceil(this.toNum(c.quantidade))),
      }))
      .filter((c) => c.produto_id > 0 && c.quantidade_chapas > 0);
  }

  private async reservarChapasInteiras(
    tx: any,
    input: {
      consumo: ReservaConsumoDto[];
      reservado_para_tipo: string;
      reservado_para_id: number;
      reservado_para_ref: string;
    },
  ) {
    let qtdReservada = 0;
    const pendencias: Array<{ produto_id: number; faltante: number }> = [];
    const estoqueChapaInteira = this.getEstoqueChapaInteiraDelegate(tx);

    for (const req of input.consumo) {
      const produtoId = this.toInt(req.produto_id);
      let faltante = Math.max(0, this.toInt(req.quantidade_chapas));
      if (produtoId <= 0 || faltante <= 0) continue;

      const registros = await estoqueChapaInteira.findMany({
        where: {
          produto_id: produtoId,
          status: 'DISPONIVEL',
          quantidade_disponivel: { gt: 0 },
        },
        orderBy: [{ criado_em: 'asc' }, { id: 'asc' }],
      });

      for (const registro of registros) {
        if (faltante <= 0) break;
        const disponivel = this.toInt(registro.quantidade_disponivel);
        if (disponivel <= 0) continue;

        const reservarAgora = Math.min(disponivel, faltante);
        const novoDisponivel = Math.max(0, disponivel - reservarAgora);

        await estoqueChapaInteira.update({
          where: { id: registro.id },
          data: {
            quantidade_disponivel: novoDisponivel,
            status: novoDisponivel > 0 ? 'DISPONIVEL' : 'RESERVADO',
            reservado_para_tipo: novoDisponivel > 0 ? null : input.reservado_para_tipo,
            reservado_para_id: novoDisponivel > 0 ? null : input.reservado_para_id,
            reservado_para_ref: novoDisponivel > 0 ? null : input.reservado_para_ref,
            reservado_em: novoDisponivel > 0 ? null : new Date(),
          },
        });

        qtdReservada += reservarAgora;
        faltante -= reservarAgora;
      }

      if (faltante > 0) {
        pendencias.push({ produto_id: produtoId, faltante });
      }
    }

    return {
      qtd_reservada: qtdReservada,
      pendencias,
    };
  }

  private async reservarRetalhosCompativeis(
    tx: any,
    input: {
      consumo: ReservaConsumoDto[];
      reservado_para_tipo: string;
      reservado_para_id: number;
      reservado_para_ref: string;
    },
  ) {
    const estoqueRetalho = this.getEstoqueRetalhoDelegate(tx);
    const pecas = input.consumo.flatMap((item) => {
      const produtoId = this.toInt(item.produto_id);
      const lista = Array.isArray(item.pecas) ? item.pecas : [];
      return lista.map((p) => ({
        produto_id: produtoId,
        largura_mm: this.toInt(p.largura_mm),
        comprimento_mm: this.toInt(p.comprimento_mm),
        id_ref: p.id_ref,
      }));
    }).filter((p) => p.produto_id > 0 && p.largura_mm > 0 && p.comprimento_mm > 0);

    if (!pecas.length) {
      return {
        qtd_reservada: 0,
        detalhe: [],
        observacao: 'Sem lista de peças/dimensões para validar compatibilidade de retalhos.',
      };
    }

    const produtoIds = [...new Set(pecas.map((p) => p.produto_id))];
    const retalhos = await estoqueRetalho.findMany({
      where: {
        produto_id: { in: produtoIds },
        status: 'DISPONIVEL',
      },
      orderBy: [{ quantidade_m2: 'asc' }, { id: 'asc' }],
    });

    const usados = new Set<number>();
    const detalhe: Array<{ produto_id: number; peca?: string | number; retalho_id: number }> = [];

    for (const peca of pecas) {
      const candidato = (retalhos || []).find(
        (r: any) =>
          r.produto_id === peca.produto_id &&
          !usados.has(r.id) &&
          this.retalhoCobrePeca(
            this.toInt(r.largura_mm),
            this.toInt(r.comprimento_mm),
            peca.largura_mm,
            peca.comprimento_mm,
          ),
      );

      if (!candidato) continue;

      await estoqueRetalho.update({
        where: { id: candidato.id },
        data: {
          status: 'RESERVADO',
          reservado_para_tipo: input.reservado_para_tipo,
          reservado_para_id: input.reservado_para_id,
          reservado_para_ref: input.reservado_para_ref,
          reservado_em: new Date(),
        },
      });

      usados.add(candidato.id);
      detalhe.push({ produto_id: peca.produto_id, peca: peca.id_ref, retalho_id: candidato.id });
    }

    return {
      qtd_reservada: usados.size,
      detalhe,
    };
  }

  private retalhoCobrePeca(
    retLargura: number,
    retComprimento: number,
    pecaLargura: number,
    pecaComprimento: number,
  ): boolean {
    const semRotacao = retLargura >= pecaLargura && retComprimento >= pecaComprimento;
    const comRotacao = retLargura >= pecaComprimento && retComprimento >= pecaLargura;
    return semRotacao || comRotacao;
  }
}
