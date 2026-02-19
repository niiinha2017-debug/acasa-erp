// src/vendas/vendas.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';

function round2(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
function toNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class VendasService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // VALIDACOES
  // ===============================
  private validarSomaPagamentos(pagamentos: any[], valorVendido: number) {
    const soma = round2(
      (pagamentos || []).reduce((acc, p) => acc + toNumber(p?.valor || 0), 0),
    );
    if (round2(soma - valorVendido) !== 0) {
      throw new BadRequestException(
        `Soma dos pagamentos (${soma}) precisa bater com valor_vendido (${valorVendido}).`,
      );
    }
  }

  // ===============================
  // CALCULOS (BASE = valor_vendido)
  // ===============================
  private calcularComissoes(valorVendido: number, dtoComissoes: any[] = []) {
    return (dtoComissoes || []).map((c) => {
      const tipo = String(c?.tipo_comissao_chave || '');
      const pct = round2(toNumber(c?.percentual_aplicado || 0));
      return {
        tipo_comissao_chave: tipo,
        percentual_aplicado: pct,
        valor_comissao: round2(valorVendido * (pct / 100)),
        responsavel_nome: c?.responsavel_nome
          ? String(c.responsavel_nome)
          : null,
      };
    });
  }

  private calcularTaxaPagamento(valorVendido: number, dto: any) {
    const pct = round2(toNumber(dto?.taxa_pagamento_percentual_aplicado || 0));
    const valor = round2(valorVendido * (pct / 100));
    return { percentual_aplicado: pct, valor_taxa_pagamento: valor };
  }

  private calcularNotaFiscal(valorVendido: number, dto: any) {
    const tem = Boolean(dto?.tem_nota_fiscal);
    const pct = tem
      ? round2(toNumber(dto?.taxa_nota_fiscal_percentual_aplicado || 0))
      : 0;
    const valor = tem ? round2(valorVendido * (pct / 100)) : 0;
    return {
      tem_nota_fiscal: tem,
      percentual_aplicado: pct,
      valor_nota_fiscal: valor,
    };
  }

  private calcularTotais(input: {
    valor_vendido: number;
    valor_taxa_pagamento: number;
    valor_nota_fiscal: number;
    soma_comissoes: number;
  }) {
    const base = round2(toNumber(input.valor_vendido));
    const taxaPag = round2(toNumber(input.valor_taxa_pagamento));
    const nf = round2(toNumber(input.valor_nota_fiscal));
    const com = round2(toNumber(input.soma_comissoes));

    const totalTaxas = round2(taxaPag + nf);
    const liquido = round2(base - totalTaxas - com);

    return {
      valor_bruto: base,
      valor_taxa_pagamento: taxaPag,
      valor_nota_fiscal: nf,
      soma_comissoes: com,
      valor_total: liquido,
    };
  }

  // ===============================
  // LISTAR / DETALHAR
  // ===============================
  async listar() {
    return this.prisma.vendas.findMany({
      orderBy: { id: 'desc' },
      include: {
        cliente: true,
        orcamento: true,
        itens: true,
        comissoes: true,
        pagamentos: true,
      },
    });
  }

  async buscarPorId(id: number) {
    const venda = await this.prisma.vendas.findUnique({
      where: { id },
      include: {
        cliente: true,
        orcamento: true,
        itens: true,
        comissoes: true,
        pagamentos: true,
      },
    });
    if (!venda) throw new NotFoundException('Venda não encontrada');
    return venda;
  }

  // ===============================
  // CRIAR
  // ===============================
  async criar(dto: CreateVendaDto) {
    if (!dto.orcamento_id)
      throw new BadRequestException('orcamento_id é obrigatório.');
    if (dto.valor_vendido === undefined || dto.valor_vendido === null)
      throw new BadRequestException('valor_vendido é obrigatório.');
    if (!dto.pagamentos?.length)
      throw new BadRequestException('Venda precisa ter ao menos 1 pagamento.');

    const orc = await this.prisma.orcamentos.findUnique({
      where: { id: dto.orcamento_id },
      include: { itens: { orderBy: { id: 'asc' } }, cliente: true },
    });
    if (!orc) throw new NotFoundException('Orçamento não encontrado.');
    if (!orc.itens?.length)
      throw new BadRequestException(
        'Orçamento precisa ter ao menos 1 ambiente.',
      );

    if (dto.cliente_id && dto.cliente_id !== orc.cliente_id) {
      throw new BadRequestException(
        'cliente_id não bate com o cliente do orçamento.',
      );
    }

    const valorVendido = round2(toNumber(dto.valor_vendido));
    this.validarSomaPagamentos(dto.pagamentos, valorVendido);

    // itens da venda:
    // - se o frontend enviar dto.itens, usamos exatamente o que veio da tela de venda
    // - senão, congelamos os itens do orçamento (com quantidade 1 e valor orçado)
    const itensClonados =
      dto.itens && dto.itens.length
        ? dto.itens.map((it) => ({
            nome_ambiente: it.nome_ambiente,
            descricao: it.descricao,
            observacao: '',
            quantidade: round2(toNumber(it.quantidade ?? 1)),
            valor_unitario: round2(toNumber(it.valor_unitario ?? 0)),
          }))
        : orc.itens.map((it) => ({
            nome_ambiente: it.nome_ambiente,
            descricao: it.descricao,
            observacao: '',
            quantidade: 1,
            valor_unitario: round2(toNumber(it.valor_unitario ?? 0)),
          }));

    const comissoesCalc = this.calcularComissoes(
      valorVendido,
      dto.comissoes || [],
    );
    const somaComissoes = round2(
      comissoesCalc.reduce((acc, c) => acc + toNumber(c.valor_comissao), 0),
    );

    const taxaPag = this.calcularTaxaPagamento(valorVendido, dto);
    const nf = this.calcularNotaFiscal(valorVendido, dto);

    const totais = this.calcularTotais({
      valor_vendido: valorVendido,
      valor_taxa_pagamento: taxaPag.valor_taxa_pagamento,
      valor_nota_fiscal: nf.valor_nota_fiscal,
      soma_comissoes: somaComissoes,
    });

    return this.prisma.$transaction(async (tx) => {
      const venda = await tx.vendas.create({
        data: {
          cliente_id: orc.cliente_id,
          orcamento_id: orc.id,
          status: dto.status,

          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          valor_vendido: valorVendido,

          valor_bruto: totais.valor_bruto,

          taxa_pagamento_percentual_aplicado: taxaPag.percentual_aplicado,
          valor_taxa_pagamento: totais.valor_taxa_pagamento,

          taxa_nota_fiscal_percentual_aplicado: nf.percentual_aplicado,
          valor_nota_fiscal: totais.valor_nota_fiscal,

          valor_total: totais.valor_total,

          // ⚠️ tem_nota_fiscal só entra aqui se existir no Prisma:
          // tem_nota_fiscal: nf.tem_nota_fiscal,
        },
      });

      await tx.vendas_itens.createMany({
        data: itensClonados.map((it) => ({
          venda_id: venda.id,
          nome_ambiente: it.nome_ambiente,
          descricao: it.descricao,
          observacao: it.observacao, // ✅ agora vai
          quantidade: it.quantidade,
          valor_unitario: it.valor_unitario,
          valor_total: round2(
            toNumber(it.quantidade) * toNumber(it.valor_unitario),
          ),
        })),
      });

      if (comissoesCalc.length) {
        await tx.vendas_comissoes.createMany({
          data: comissoesCalc.map((c) => ({
            venda_id: venda.id,
            tipo_comissao_chave: c.tipo_comissao_chave,
            percentual_aplicado: c.percentual_aplicado,
            valor_comissao: c.valor_comissao,
            responsavel_nome: c.responsavel_nome,
          })),
        });
      }

      await tx.vendas_pagamentos.createMany({
        data: (dto.pagamentos || []).map((p) => ({
          venda_id: venda.id,
          forma_pagamento_chave: String(p.forma_pagamento_chave),
          valor: round2(toNumber(p.valor)),
          data_prevista_recebimento: p.data_prevista_recebimento
            ? new Date(p.data_prevista_recebimento)
            : null,
          data_recebimento: p.data_recebimento
            ? new Date(p.data_recebimento)
            : null,
          status_financeiro_chave: p.status_financeiro_chave
            ? String(p.status_financeiro_chave)
            : 'EM_ABERTO',
        })),
      });

      return tx.vendas.findUnique({
        where: { id: venda.id },
        include: {
          cliente: true,
          orcamento: true,
          itens: true,
          comissoes: true,
          pagamentos: true,
        },
      });
    });
  }
  async enviarParaProducao(vendaId: number, dataProducao: string) {
    throw new BadRequestException(
      'Status do processo é controlado pela Agenda (Produção), não por Vendas.',
    );
  }

  // ===============================
  // ATUALIZAR
  // ===============================
  async atualizar(id: number, dto: UpdateVendaDto) {
    const atual = await this.prisma.vendas.findUnique({
      where: { id },
      include: { pagamentos: true },
    });
    if (!atual) throw new NotFoundException('Venda não encontrada');

    const valorVendido =
      dto.valor_vendido !== undefined && dto.valor_vendido !== null
        ? round2(toNumber(dto.valor_vendido))
        : round2(toNumber(atual.valor_vendido));

    if (dto.pagamentos?.length)
      this.validarSomaPagamentos(dto.pagamentos as any, valorVendido);

    const comissoesCalc = dto.comissoes
      ? this.calcularComissoes(valorVendido, dto.comissoes)
      : [];
    const somaComissoes = round2(
      comissoesCalc.reduce((acc, c) => acc + toNumber(c.valor_comissao), 0),
    );

    const taxaPag = this.calcularTaxaPagamento(valorVendido, dto);
    const nf = this.calcularNotaFiscal(valorVendido, dto);

    const totais = this.calcularTotais({
      valor_vendido: valorVendido,
      valor_taxa_pagamento: taxaPag.valor_taxa_pagamento,
      valor_nota_fiscal: nf.valor_nota_fiscal,
      soma_comissoes: somaComissoes,
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.vendas.update({
        where: { id },
        data: {
          status: dto.status ?? undefined,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          valor_vendido: valorVendido,

          valor_bruto: totais.valor_bruto,

          taxa_pagamento_percentual_aplicado: taxaPag.percentual_aplicado,
          valor_taxa_pagamento: totais.valor_taxa_pagamento,

          taxa_nota_fiscal_percentual_aplicado: nf.percentual_aplicado,
          valor_nota_fiscal: totais.valor_nota_fiscal,

          valor_total: totais.valor_total,
        },
      });

      if (dto.comissoes) {
        await tx.vendas_comissoes.deleteMany({ where: { venda_id: id } });
        if (comissoesCalc.length) {
          await tx.vendas_comissoes.createMany({
            data: comissoesCalc.map((c) => ({
              venda_id: id,
              tipo_comissao_chave: c.tipo_comissao_chave,
              percentual_aplicado: c.percentual_aplicado,
              valor_comissao: c.valor_comissao,
              responsavel_nome: c.responsavel_nome,
            })),
          });
        }
      }

      if (dto.pagamentos) {
        await tx.vendas_pagamentos.deleteMany({ where: { venda_id: id } });
        await tx.vendas_pagamentos.createMany({
          data: (dto.pagamentos || []).map((p) => ({
            venda_id: id,
            forma_pagamento_chave: String(p.forma_pagamento_chave),
            valor: round2(toNumber(p.valor)),
            data_prevista_recebimento: p.data_prevista_recebimento
              ? new Date(p.data_prevista_recebimento)
              : null,
            data_recebimento: p.data_recebimento
              ? new Date(p.data_recebimento)
              : null,
            status_financeiro_chave: p.status_financeiro_chave
              ? String(p.status_financeiro_chave)
              : 'EM_ABERTO',
          })),
        });
      }

      return tx.vendas.findUnique({
        where: { id },
        include: {
          cliente: true,
          orcamento: true,
          itens: true,
          comissoes: true,
          pagamentos: true,
        },
      });
    });
  }

  async atualizarStatus(id: number, status: string) {
    await this.buscarPorId(id);
    return this.prisma.vendas.update({ where: { id }, data: { status } });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.prisma.vendas.delete({ where: { id } });
  }

  async atualizarItem(vendaId: number, itemId: number, dto: any) {
    if (vendaId <= 0) throw new BadRequestException('ID da venda inválido.');
    if (itemId <= 0) throw new BadRequestException('ID do item inválido.');

    // garante venda existe
    await this.buscarPorId(vendaId);

    // garante item pertence à venda
    const item = await this.prisma.vendas_itens.findFirst({
      where: { id: itemId, venda_id: vendaId },
    });
    if (!item)
      throw new NotFoundException('Item não encontrado para esta venda.');

    const quantidade =
      dto.quantidade !== undefined
        ? round2(toNumber(dto.quantidade))
        : toNumber(item.quantidade);
    const valorUnit =
      dto.valor_unitario !== undefined
        ? round2(toNumber(dto.valor_unitario))
        : toNumber(item.valor_unitario);
    const valorTotal = round2(quantidade * valorUnit);

    return this.prisma.vendas_itens.update({
      where: { id: itemId },
      data: {
        nome_ambiente: dto.nome_ambiente ?? undefined,
        descricao: dto.descricao ?? undefined,
        observacao: dto.observacao ?? undefined,
        quantidade: dto.quantidade !== undefined ? quantidade : undefined,
        valor_unitario:
          dto.valor_unitario !== undefined ? valorUnit : undefined,
        valor_total:
          dto.quantidade !== undefined || dto.valor_unitario !== undefined
            ? valorTotal
            : undefined,
      },
    });
  }

  async listarAmbientes(vendaId: number) {
    await this.buscarPorId(vendaId); // garante que existe e respeita o NotFound

    const itens = await this.prisma.vendas_itens.findMany({
      where: { venda_id: vendaId },
      select: { nome_ambiente: true },
      orderBy: { nome_ambiente: 'asc' },
    });

    const set = new Set<string>();
    for (const it of itens) {
      const nome = String(it.nome_ambiente || '').trim();
      if (nome) set.add(nome);
    }

    return Array.from(set).map((nome) => ({ nome }));
  }
}
