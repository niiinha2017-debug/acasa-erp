import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgendaService } from '../agenda/agenda.service';
import { CreateVendaDto } from './dto/create-venda.dto';
import { UpdateVendaDto } from './dto/update-venda.dto';
import {
  STATUS_POS_VENDA,
  statusClienteEhValido,
  validarTransicaoStatusCliente,
} from '../shared/constantes/pipeline-cliente';
import { VENDA_FECHAMENTO_REGRAS } from '../shared/constantes/venda-fechamento';

function round2(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
function toNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class VendasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agendaService: AgendaService,
  ) {}

  private readonly statusPosVenda = STATUS_POS_VENDA;

  private validarStatusDestino(status: string, contexto: string) {
    if (!statusClienteEhValido(status)) {
      throw new BadRequestException(
        `${contexto}: status "${String(status || '').toUpperCase()}" inválido no pipeline.`,
      );
    }
  }

  private validarTransicaoStatusVenda(
    statusAtual: string | null | undefined,
    proximoStatus: string,
    contexto: string,
  ) {
    const resultado = validarTransicaoStatusCliente({
      atual: statusAtual,
      proximo: proximoStatus,
    });
    if (!resultado.ok) {
      throw new BadRequestException(`${contexto}: ${resultado.motivo}`);
    }
  }

  private resolverStatusPosVenda(
    vendaStatus?: string | null,
    clienteStatus?: string | null,
  ) {
    const venda = String(vendaStatus || '').toUpperCase();
    const cliente = String(clienteStatus || '').toUpperCase();
    if ((this.statusPosVenda as readonly string[]).includes(venda)) {
      return { status: venda, status_source: 'venda' as const };
    }
    if ((this.statusPosVenda as readonly string[]).includes(cliente)) {
      return { status: cliente, status_source: 'cliente' as const };
    }
    return { status: '', status_source: null };
  }

  private async enviarAutomaticamenteParaProducaoQuandoContratoAssinado(
    vendaId: number,
  ) {
    if (!Number.isFinite(vendaId) || vendaId <= 0) return;

    const agendaJaNaFabrica = await this.prisma.agenda_fabrica.findFirst({
      where: {
        venda_id: vendaId,
        status: { not: 'CANCELADO' },
      },
      select: { id: true },
    });
    if (agendaJaNaFabrica) return;

    const agendaContratoLoja = await this.prisma.agenda_loja.findFirst({
      where: {
        venda_id: vendaId,
        status: { not: 'CANCELADO' },
        categoria: 'CONTRATO',
      },
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const agendaLoja = agendaContratoLoja
      ? agendaContratoLoja
      : await this.prisma.agenda_loja.findFirst({
          where: {
            venda_id: vendaId,
            status: { not: 'CANCELADO' },
          },
          orderBy: { id: 'desc' },
          select: { id: true },
        });

    if (agendaLoja?.id) {
      await this.agendaService.enviarParaProducao(agendaLoja.id);
      return;
    }

    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      select: { id: true, cliente_id: true },
    });
    if (!venda) return;

    const inicio = new Date();
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);

    await this.prisma.agenda_fabrica.create({
      data: {
        titulo: `Produção da venda #${vendaId}`,
        inicio_em: inicio,
        fim_em: fim,
        categoria: 'PRODUCAO_RECEBIDA',
        origem_fluxo: 'LOJA_VENDA',
        status: 'PENDENTE',
        venda_id: vendaId,
        cliente_id: venda.cliente_id || null,
      },
    });
  }

  // ===============================
  // VALIDACOES
  // ===============================
  private validarSomaPagamentos(pagamentos: any[], valorEsperado: number) {
    const soma = round2(
      (pagamentos || []).reduce((acc, p) => acc + toNumber(p?.valor || 0), 0),
    );
    if (round2(soma - valorEsperado) !== 0) {
      throw new BadRequestException(
        `Soma dos pagamentos (${soma}) precisa bater com o valor esperado (${valorEsperado}).`,
      );
    }
  }

  private validarRegraDesconto(valorVendido: number, totalOrcado: number) {
    const total = round2(toNumber(totalOrcado));
    const vendido = round2(toNumber(valorVendido));
    if (total <= 0) return;
    const descontoPercentual = round2(((total - vendido) / total) * 100);
    const maximo = Number(
      VENDA_FECHAMENTO_REGRAS.DESCONTO_MAXIMO_PERCENTUAL || 0,
    );
    if (descontoPercentual > maximo) {
      throw new BadRequestException(
        `Desconto máximo permitido é ${maximo}%. Valor mínimo da venda para este orçamento: ${round2(
          total * (1 - maximo / 100),
        )}.`,
      );
    }
  }

  private toIntOrNull(v: any): number | null {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  private async resolverResponsavelIds(input: {
    usuarioId?: any;
    funcionarioId?: any;
    nome?: any;
  }): Promise<{
    usuarioId: number | null;
    funcionarioId: number | null;
    nome: string | null;
  }> {
    let usuarioId = this.toIntOrNull(input.usuarioId);
    let funcionarioId = this.toIntOrNull(input.funcionarioId);
    let nome = String(input.nome || '').trim() || null;

    if (usuarioId) {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id: usuarioId },
        select: { id: true, nome: true, funcionario_id: true },
      });
      if (!usuario) {
        throw new BadRequestException(`Usuário ${usuarioId} não encontrado.`);
      }
      if (
        funcionarioId &&
        usuario.funcionario_id &&
        funcionarioId !== usuario.funcionario_id
      ) {
        throw new BadRequestException(
          `Usuário ${usuarioId} não está vinculado ao funcionário ${funcionarioId}.`,
        );
      }
      funcionarioId = funcionarioId || usuario.funcionario_id || null;
      nome = nome || usuario.nome || null;
    }

    if (funcionarioId) {
      const funcionario = await this.prisma.funcionarios.findUnique({
        where: { id: funcionarioId },
        select: { id: true, nome: true, usuario_id: true },
      });
      if (!funcionario) {
        throw new BadRequestException(
          `Funcionário ${funcionarioId} não encontrado.`,
        );
      }
      if (
        usuarioId &&
        funcionario.usuario_id &&
        usuarioId !== funcionario.usuario_id
      ) {
        throw new BadRequestException(
          `Funcionário ${funcionarioId} não está vinculado ao usuário ${usuarioId}.`,
        );
      }
      usuarioId = usuarioId || funcionario.usuario_id || null;
      nome = nome || funcionario.nome || null;
    }

    if (!usuarioId && !funcionarioId && nome) {
      const usuarioPorNome = await this.prisma.usuarios.findFirst({
        where: { nome: { equals: nome } },
        select: { id: true, nome: true, funcionario_id: true },
      });
      if (usuarioPorNome) {
        usuarioId = usuarioPorNome.id;
        funcionarioId = usuarioPorNome.funcionario_id || null;
        nome = usuarioPorNome.nome || nome;
      } else {
        const funcionarioPorNome = await this.prisma.funcionarios.findFirst({
          where: { nome: { equals: nome } },
          select: { id: true, nome: true, usuario_id: true },
        });
        if (funcionarioPorNome) {
          funcionarioId = funcionarioPorNome.id;
          usuarioId = funcionarioPorNome.usuario_id || null;
          nome = funcionarioPorNome.nome || nome;
        }
      }
    }

    return { usuarioId, funcionarioId, nome };
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
        responsavel_usuario_id: this.toIntOrNull(c?.responsavel_usuario_id),
        responsavel_funcionario_id: this.toIntOrNull(
          c?.responsavel_funcionario_id,
        ),
      };
    });
  }

  private async enriquecerComissoesComIds(comissoes: any[] = []) {
    return Promise.all(
      (comissoes || []).map(async (c) => {
        const resp = await this.resolverResponsavelIds({
          usuarioId: c?.responsavel_usuario_id,
          funcionarioId: c?.responsavel_funcionario_id,
          nome: c?.responsavel_nome,
        });
        return {
          ...c,
          responsavel_nome: resp.nome,
          responsavel_usuario_id: resp.usuarioId,
          responsavel_funcionario_id: resp.funcionarioId,
        };
      }),
    );
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
        formas_pagamento: true,
      },
    });
  }

  /** Vendas em etapas que aguardam agendamento, incluindo pós-venda.
   * Observação: algumas etapas de pós-venda podem estar no status do cliente.
   */
  /** Vendas que podem ser vinculadas a agendamentos de tipo CONTRATO/VENDA_FECHADA:
   *  - em etapas pré-contrato (ORCAMENTO_APROVADO, VENDA_FECHADA, CONTRATO_ASSINADO), ou
   *  - com contrato vigente (para que o usuário possa vincular e o card exiba "Venda #id").
   */
  async listarAguardandoContrato() {
    const statusContrato = [
      'ORCAMENTO_APROVADO',
      'VENDA_FECHADA',
      'CONTRATO_ASSINADO',
    ];
    const lista = await this.prisma.vendas.findMany({
      where: {
        OR: [
          { status: { in: statusContrato } },
          { contratos: { some: { status: 'VIGENTE' } } },
        ],
      },
      orderBy: { id: 'asc' },
      include: { cliente: true },
    });
    return lista;
  }

  async listarAguardandoAgendamento() {
    const vendaStatuses = [
      'CONTRATO_GERADO',
      'AGENDAR_MEDIDA',
      'AGENDAR_MEDIDA_FINA',
      'GARANTIA',
      'MANUTENCAO',
      'ASSISTENCIA',
    ];
    const clienteStatusesPosVenda = [...this.statusPosVenda];

    const [porStatusVenda, porStatusCliente] = await Promise.all([
      this.prisma.vendas.findMany({
        where: { status: { in: vendaStatuses } },
        orderBy: { id: 'asc' },
        include: { cliente: true },
      }),
      this.prisma.vendas.findMany({
        where: { cliente: { status: { in: clienteStatusesPosVenda } } },
        orderBy: { id: 'asc' },
        include: { cliente: true },
      }),
    ]);

    // Dedupe explícito por venda.id com prioridade da fonte de status: venda > cliente.
    const porId = new Map<number, any>();
    const todas = [...porStatusCliente, ...porStatusVenda] as Array<
      (typeof porStatusVenda)[number] & { cliente?: { status: string } | null }
    >;
    for (const venda of todas) {
      const efetivo = this.resolverStatusPosVenda(
        venda.status,
        venda.cliente?.status,
      );
      porId.set(venda.id, {
        ...venda,
        status_source: efetivo.status_source,
        status_pos_venda: efetivo.status || null,
      });
    }

    return Array.from(porId.values()).sort((a, b) => a.id - b.id);
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
        formas_pagamento: true,
      },
    });
    if (!venda) throw new NotFoundException('Venda não encontrada');
    return venda;
  }

  // ===============================
  // CRIAR
  // ===============================
  async criar(dto: CreateVendaDto) {
    this.validarStatusDestino(dto.status, 'Criação de venda');

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
    const totalOrcado = round2(
      (orc.itens || []).reduce(
        (acc, it) => acc + toNumber((it as any)?.valor_unitario || 0),
        0,
      ),
    );
    this.validarRegraDesconto(valorVendido, totalOrcado);
    // Quando há taxa de cartão, valor_vendido = preço cobrado (base + juros); a soma dos pagamentos deve bater com valor_vendido (total a receber).
    const valorParaSomaPagamentos =
      dto.valor_base_venda !== undefined && dto.valor_base_venda !== null
        ? round2(toNumber(dto.valor_base_venda))
        : valorVendido;
    this.validarSomaPagamentos(dto.pagamentos, valorParaSomaPagamentos);

    const valorBaseContrato =
      dto.valor_base_contrato !== undefined && dto.valor_base_contrato !== null
        ? round2(toNumber(dto.valor_base_contrato))
        : null;

    // itens da venda:
    // - se o frontend enviar dto.itens, usamos exatamente o que veio da tela de venda
    // - senão, congelamos os itens do orçamento (com quantidade 1 e valor orçado)
    const itensClonados =
      dto.itens && dto.itens.length
        ? dto.itens.map((it) => ({
            nome_ambiente: it.nome_ambiente,
            descricao: it.descricao,
            observacao: (it as any).observacao?.trim?.() ?? '',
            quantidade: round2(toNumber(it.quantidade ?? 1)),
            valor_unitario: round2(toNumber(it.valor_unitario ?? 0)),
          }))
        : orc.itens.map((it) => ({
            nome_ambiente: it.nome_ambiente,
            descricao: it.descricao,
            observacao: (it as any).observacao?.trim?.() ?? '',
            quantidade: 1,
            valor_unitario: round2(toNumber(it.valor_unitario ?? 0)),
          }));

    const representante = await this.resolverResponsavelIds({
      usuarioId: (dto as any).representante_venda_usuario_id,
      funcionarioId: (dto as any).representante_venda_funcionario_id,
      nome: dto.representante_venda_nome,
    });

    const comissoesCalc = await this.enriquecerComissoesComIds(
      this.calcularComissoes(valorVendido, dto.comissoes || []),
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
          endereco_entrega: dto.endereco_entrega?.trim() || null,
          valor_vendido: valorVendido,
          valor_base_contrato: valorBaseContrato,

          valor_bruto: totais.valor_bruto,

          taxa_pagamento_percentual_aplicado: taxaPag.percentual_aplicado,
          valor_taxa_pagamento: totais.valor_taxa_pagamento,

          taxa_nota_fiscal_percentual_aplicado: nf.percentual_aplicado,
          valor_nota_fiscal: totais.valor_nota_fiscal,

          valor_total: totais.valor_total,

          representante_venda_nome:
            dto.representante_venda_nome?.trim() || representante.nome || null,
          representante_venda_cpf: dto.representante_venda_cpf?.trim() || null,
          representante_venda_rg: dto.representante_venda_rg?.trim() || null,
          representante_venda_usuario_id: representante.usuarioId,
          representante_venda_funcionario_id: representante.funcionarioId,
          representante_venda_2_nome: (dto as any).representante_venda_2_nome?.trim() || null,
          representante_venda_2_cpf: (dto as any).representante_venda_2_cpf?.trim() || null,
          representante_venda_2_rg: (dto as any).representante_venda_2_rg?.trim() || null,

          receber_no_ato_medicao: Boolean((dto as any).receber_no_ato_medicao),

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
            responsavel_usuario_id: c.responsavel_usuario_id,
            responsavel_funcionario_id: c.responsavel_funcionario_id,
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

      if (dto.formas_pagamento?.length) {
        await tx.vendas_formas_pagamento.createMany({
          data: dto.formas_pagamento.map((f) => ({
            venda_id: venda.id,
            forma_pagamento_chave: String(f.forma_pagamento_chave),
            valor_base: round2(toNumber(f.valor_base)),
            quantidade_parcelas: Math.max(1, Number(f.quantidade_parcelas) || 1),
            com_juros: Boolean(f.com_juros),
          })),
        });
      }

      if (orc.cliente_id && dto.status) {
        const cliente = await tx.cliente.findUnique({
          where: { id: orc.cliente_id },
          select: { id: true, status: true },
        });
        if (
          cliente &&
          validarTransicaoStatusCliente({
            atual: cliente.status,
            proximo: dto.status,
          }).ok &&
          String(cliente.status || '').toUpperCase() !==
            String(dto.status).toUpperCase()
        ) {
          await tx.cliente.update({
            where: { id: orc.cliente_id },
            data: { status: dto.status },
          });
        }
      }

      return tx.vendas.findUnique({
        where: { id: venda.id },
        include: {
          cliente: true,
          orcamento: true,
          itens: true,
          comissoes: true,
          pagamentos: true,
          formas_pagamento: true,
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

    if (dto.status !== undefined) {
      this.validarStatusDestino(dto.status, 'Atualização de venda');
      this.validarTransicaoStatusVenda(
        atual.status,
        dto.status,
        'Atualização de venda',
      );
    }

    const valorVendido =
      dto.valor_vendido !== undefined && dto.valor_vendido !== null
        ? round2(toNumber(dto.valor_vendido))
        : round2(toNumber(atual.valor_vendido));

    const orc = await this.prisma.orcamentos.findUnique({
      where: { id: atual.orcamento_id },
      include: { itens: true },
    });
    if (!orc) throw new NotFoundException('Orçamento da venda não encontrado.');
    const totalOrcado = round2(
      (orc.itens || []).reduce(
        (acc, it) => acc + toNumber((it as any)?.valor_unitario || 0),
        0,
      ),
    );
    this.validarRegraDesconto(valorVendido, totalOrcado);

    if (dto.pagamentos?.length) {
      const valorParaSomaPagamentos =
        dto.valor_base_venda !== undefined && dto.valor_base_venda !== null
          ? round2(toNumber(dto.valor_base_venda))
          : valorVendido;
      this.validarSomaPagamentos(dto.pagamentos as any, valorParaSomaPagamentos);
    }

    const representanteMudou =
      dto.representante_venda_nome !== undefined ||
      dto.representante_venda_cpf !== undefined ||
      dto.representante_venda_rg !== undefined ||
      (dto as any).representante_venda_usuario_id !== undefined ||
      (dto as any).representante_venda_funcionario_id !== undefined;

    const representante = representanteMudou
      ? await this.resolverResponsavelIds({
          usuarioId:
            (dto as any).representante_venda_usuario_id !== undefined
              ? (dto as any).representante_venda_usuario_id
              : (atual as any).representante_venda_usuario_id,
          funcionarioId:
            (dto as any).representante_venda_funcionario_id !== undefined
              ? (dto as any).representante_venda_funcionario_id
              : (atual as any).representante_venda_funcionario_id,
          nome:
            dto.representante_venda_nome !== undefined
              ? dto.representante_venda_nome
              : (atual as any).representante_venda_nome,
        })
      : null;

    const comissoesCalc = dto.comissoes
      ? await this.enriquecerComissoesComIds(
          this.calcularComissoes(valorVendido, dto.comissoes),
        )
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

    const vendaAtualizada = await this.prisma.$transaction(async (tx) => {
      await tx.vendas.update({
        where: { id },
        data: {
          status: dto.status ?? undefined,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          ...(dto.endereco_entrega !== undefined && {
            endereco_entrega: dto.endereco_entrega?.trim() || null,
          }),
          valor_vendido: valorVendido,
          ...(dto.valor_base_contrato !== undefined && dto.valor_base_contrato !== null && {
            valor_base_contrato: round2(toNumber(dto.valor_base_contrato)),
          }),
          ...(dto.receber_no_ato_medicao !== undefined && {
            receber_no_ato_medicao: Boolean(dto.receber_no_ato_medicao),
          }),

          valor_bruto: totais.valor_bruto,

          taxa_pagamento_percentual_aplicado: taxaPag.percentual_aplicado,
          valor_taxa_pagamento: totais.valor_taxa_pagamento,

          taxa_nota_fiscal_percentual_aplicado: nf.percentual_aplicado,
          valor_nota_fiscal: totais.valor_nota_fiscal,

          valor_total: totais.valor_total,

          ...(dto.representante_venda_nome !== undefined && {
            representante_venda_nome:
              dto.representante_venda_nome?.trim() || null,
          }),
          ...(dto.representante_venda_cpf !== undefined && {
            representante_venda_cpf:
              dto.representante_venda_cpf?.trim() || null,
          }),
          ...(dto.representante_venda_rg !== undefined && {
            representante_venda_rg: dto.representante_venda_rg?.trim() || null,
          }),
          ...(representanteMudou && {
            representante_venda_nome:
              dto.representante_venda_nome !== undefined
                ? dto.representante_venda_nome?.trim() || null
                : representante?.nome || null,
            representante_venda_usuario_id: representante?.usuarioId || null,
            representante_venda_funcionario_id:
              representante?.funcionarioId || null,
          }),
          ...((dto as any).representante_venda_2_nome !== undefined && {
            representante_venda_2_nome: (dto as any).representante_venda_2_nome?.trim() || null,
          }),
          ...((dto as any).representante_venda_2_cpf !== undefined && {
            representante_venda_2_cpf: (dto as any).representante_venda_2_cpf?.trim() || null,
          }),
          ...((dto as any).representante_venda_2_rg !== undefined && {
            representante_venda_2_rg: (dto as any).representante_venda_2_rg?.trim() || null,
          }),
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
              responsavel_usuario_id: c.responsavel_usuario_id,
              responsavel_funcionario_id: c.responsavel_funcionario_id,
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

      if (dto.formas_pagamento) {
        await tx.vendas_formas_pagamento.deleteMany({ where: { venda_id: id } });
        if (dto.formas_pagamento.length) {
          await tx.vendas_formas_pagamento.createMany({
            data: dto.formas_pagamento.map((f) => ({
              venda_id: id,
              forma_pagamento_chave: String(f.forma_pagamento_chave),
              valor_base: round2(toNumber(f.valor_base)),
              quantidade_parcelas: Math.max(1, Number(f.quantidade_parcelas) || 1),
              com_juros: Boolean(f.com_juros),
            })),
          });
        }
      }

      if (
        dto.status !== undefined &&
        (atual as any).cliente_id &&
        statusClienteEhValido(dto.status)
      ) {
        const cliente = await tx.cliente.findUnique({
          where: { id: (atual as any).cliente_id },
          select: { id: true, status: true },
        });
        if (
          cliente &&
          validarTransicaoStatusCliente({
            atual: cliente.status,
            proximo: dto.status,
          }).ok &&
          String(cliente.status || '').toUpperCase() !==
            String(dto.status).toUpperCase()
        ) {
          await tx.cliente.update({
            where: { id: (atual as any).cliente_id },
            data: { status: dto.status },
          });
        }
      }

      return tx.vendas.findUnique({
        where: { id },
        include: {
          cliente: true,
          orcamento: true,
          itens: true,
          comissoes: true,
          pagamentos: true,
          formas_pagamento: true,
        },
      });
    });

    const statusAnterior = String(atual.status || '').toUpperCase();
    const statusNovo = String(dto.status || statusAnterior).toUpperCase();
    if (
      statusAnterior !== 'CONTRATO_ASSINADO' &&
      statusNovo === 'CONTRATO_ASSINADO'
    ) {
      await this.enviarAutomaticamenteParaProducaoQuandoContratoAssinado(id);
    }

    return vendaAtualizada;
  }

  async atualizarStatus(id: number, status: string) {
    const venda = await this.buscarPorId(id);
    this.validarStatusDestino(status, 'Atualização de status da venda');
    this.validarTransicaoStatusVenda(
      venda.status,
      status,
      'Atualização de status da venda',
    );
    const vendaAtualizada = await this.prisma.vendas.update({
      where: { id },
      data: { status },
    });
    const clienteId = (venda as any).cliente_id;
    if (
      clienteId &&
      statusClienteEhValido(status) &&
      String((venda as any).status || '').toUpperCase() !==
        String(status).toUpperCase()
    ) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { id: true, status: true },
      });
      if (
        cliente &&
        validarTransicaoStatusCliente({
          atual: cliente.status,
          proximo: status,
        }).ok
      ) {
        await this.prisma.cliente.update({
          where: { id: clienteId },
          data: { status },
        });
      }
    }
    const statusAnterior = String(venda.status || '').toUpperCase();
    const statusNovo = String(status || '').toUpperCase();
    if (
      statusAnterior !== 'CONTRATO_ASSINADO' &&
      statusNovo === 'CONTRATO_ASSINADO'
    ) {
      await this.enviarAutomaticamenteParaProducaoQuandoContratoAssinado(id);
    }
    return vendaAtualizada;
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
