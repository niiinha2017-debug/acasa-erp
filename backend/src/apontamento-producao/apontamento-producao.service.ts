import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApontamentoProducaoDto } from './dto/create-apontamento-producao.dto';
import { UpdateApontamentoProducaoDto } from './dto/update-apontamento-producao.dto';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS,
  AGENDA_FABRICA_STATUS_AGENDADO,
  AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL,
} from '../shared/constantes/pipeline-producao';
import { validarTransicaoStatusCliente } from '../shared/constantes/pipeline-cliente';

/** Categorias da agenda_loja que são "medição" (funcionário da fábrica vai até o cliente). Só essas entram na Timeline de Produção. */
const CATEGORIAS_AGENDA_LOJA_MEDICAO = ['MEDIDA', 'MEDIDA_AGENDADA', 'AGENDAR_MEDIDA'] as const;

/** Categoria normalizada para medição (case-insensitive). */
function ehCategoriaMedida(categoria: string | null | undefined): boolean {
  const key = String(categoria ?? '').toUpperCase().trim();
  return CATEGORIAS_AGENDA_LOJA_MEDICAO.includes(key as any);
}

@Injectable()
export class ApontamentoProducaoService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularHoras(
    inicio: Date,
    fim: Date,
    pausaInicio?: Date | null,
    pausaFim?: Date | null,
  ): number {
    let diff = fim.getTime() - inicio.getTime();
    if (pausaInicio && pausaFim && pausaFim > pausaInicio) {
      diff -= pausaFim.getTime() - pausaInicio.getTime();
    }
    const horas = Math.max(0, diff / (1000 * 60 * 60));
    return Math.round(horas * 100) / 100;
  }

  /** Calcula horas descontando pausa total (segundos) e opcionalmente a pausa atual (ainda aberta). Nunca retorna negativo. */
  private calcularHorasComPausas(
    inicio: Date,
    fim: Date,
    pausaTotalSegundos: number,
    pausaAtualInicio?: Date | null,
  ): number {
    let diff = fim.getTime() - inicio.getTime();
    diff -= (pausaTotalSegundos || 0) * 1000;
    if (pausaAtualInicio) {
      diff -= Date.now() - pausaAtualInicio.getTime();
    }
    const horas = Math.max(0, diff / (1000 * 60 * 60));
    return Math.round(horas * 100) / 100;
  }

  private async calcularCusto(funcionarioId: number, horas: number): Promise<Decimal | null> {
    const f = await this.prisma.funcionarios.findUnique({
      where: { id: funcionarioId },
      select: { custo_hora: true },
    });
    if (!f?.custo_hora) return null;
    const custo = Number(f.custo_hora) * horas;
    return new Decimal(custo);
  }

  async create(dto: CreateApontamentoProducaoDto) {
    const inicio = new Date(dto.inicio_em);
    const fim = new Date(dto.fim_em);
    const pausaInicio = dto.pausa_inicio_em ? new Date(dto.pausa_inicio_em) : null;
    const pausaFim = dto.pausa_fim_em ? new Date(dto.pausa_fim_em) : null;
    const horas = dto.horas ?? this.calcularHoras(inicio, fim, pausaInicio, pausaFim);
    const custo_calculado = await this.calcularCusto(dto.funcionario_id, horas);

    const data = dto.data.includes('T') ? dto.data : `${dto.data}T00:00:00`;
    const dataDate = new Date(data);
    dataDate.setHours(0, 0, 0, 0);

    let venda_id = dto.venda_id ?? undefined;
    let categoria = dto.categoria ?? undefined;
    if (dto.agenda_fabrica_id) {
      const ag = await this.prisma.agenda_fabrica.findUnique({
        where: { id: dto.agenda_fabrica_id },
        select: { venda_id: true, categoria: true },
      });
      if (ag) {
        if (ag.venda_id) venda_id = ag.venda_id;
        if (ag.categoria) categoria = ag.categoria;
      }
    }
    if (dto.agenda_loja_id) {
      const ag = await this.prisma.agenda_loja.findUnique({
        where: { id: dto.agenda_loja_id },
        select: { venda_id: true, categoria: true },
      });
      if (ag) {
        if (ag.venda_id) venda_id = ag.venda_id;
        if (ag.categoria) categoria = ag.categoria;
      }
    }

    return this.prisma.apontamento_producao.create({
      data: {
        agenda_fabrica_id: dto.agenda_fabrica_id ?? undefined,
        agenda_loja_id: dto.agenda_loja_id ?? undefined,
        venda_id,
        funcionario_id: dto.funcionario_id,
        categoria,
        data: dataDate,
        inicio_em: inicio,
        fim_em: fim,
        pausa_inicio_em: pausaInicio ?? undefined,
        pausa_fim_em: pausaFim ?? undefined,
        horas: horas,
        custo_calculado,
        observacao: dto.observacao ?? undefined,
      } as any,
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: { select: { id: true, titulo: true, categoria: true } },
        agenda_loja: { select: { id: true, titulo: true, categoria: true } },
        venda: { select: { id: true } },
      },
    });
  }

  private whereVendedorAgenda(funcionarioId: number) {
    return {
      OR: [
        { cliente: { vendedor_responsavel_id: funcionarioId } },
        { venda: { representante_venda_funcionario_id: funcionarioId } },
        { equipe: { some: { funcionario_id: funcionarioId } } },
      ],
    };
  }

  async findAll(filtros: {
    agenda_fabrica_id?: number;
    agenda_loja_id?: number;
    tipo_agenda?: 'venda' | 'producao'; // filtra por agenda de venda ou de produção
    venda_id?: number;
    funcionario_id?: number;
    data_inicio?: string;
    data_fim?: string;
    categoria?: string;
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null;
  }) {
    const where: Record<string, unknown> = {};
    if (filtros.agenda_fabrica_id != null) {
      where.agenda_fabrica_id = filtros.agenda_fabrica_id;
    } else if (filtros.tipo_agenda === 'producao') {
      where.agenda_fabrica_id = { not: null };
    }
    if (filtros.agenda_loja_id != null) {
      where.agenda_loja_id = filtros.agenda_loja_id;
    } else if (filtros.tipo_agenda === 'venda') {
      where.agenda_loja_id = { not: null };
    }
    const funcionarioIdVendedor =
      filtros.usuario?.funcionario_id != null && !filtros.usuario?.is_admin
        ? Number(filtros.usuario.funcionario_id)
        : null;
    if (funcionarioIdVendedor != null) {
      const vendedorWhere = this.whereVendedorAgenda(funcionarioIdVendedor);
      if (filtros.tipo_agenda === 'venda') {
        where.agenda_loja = vendedorWhere;
      } else if (filtros.tipo_agenda === 'producao') {
        where.agenda_fabrica = vendedorWhere;
      }
    }
    if (filtros.venda_id != null) {
      where.venda_id = filtros.venda_id;
    }
    if (filtros.funcionario_id != null) {
      where.funcionario_id = filtros.funcionario_id;
    }
    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }
    if (filtros.data_inicio || filtros.data_fim) {
      where.data = {};
      if (filtros.data_inicio) {
        (where.data as Record<string, Date>).gte = new Date(filtros.data_inicio);
      }
      if (filtros.data_fim) {
        (where.data as Record<string, Date>).lte = new Date(filtros.data_fim);
      }
    }

    // select explícito (sem pausa_* se as colunas não existirem no banco)
    return this.prisma.apontamento_producao.findMany({
      where,
      select: {
        id: true,
        agenda_fabrica_id: true,
        agenda_loja_id: true,
        venda_id: true,
        funcionario_id: true,
        categoria: true,
        data: true,
        inicio_em: true,
        fim_em: true,
        horas: true,
        custo_calculado: true,
        observacao: true,
        criado_em: true,
        atualizado_em: true,
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: {
          select: {
            id: true,
            titulo: true,
            categoria: true,
            inicio_em: true,
            fim_em: true,
            status: true,
            criado_por_usuario_id: true,
            criado_por_usuario: { select: { id: true, nome: true } },
          },
        },
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            categoria: true,
            inicio_em: true,
            fim_em: true,
            status: true,
            criado_por_usuario_id: true,
            criado_por_usuario: { select: { id: true, nome: true } },
          },
        },
        venda: { select: { id: true } },
      },
      orderBy: [{ data: 'desc' }, { inicio_em: 'desc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.apontamento_producao.findUnique({
      where: { id },
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: {
          select: { id: true, titulo: true, categoria: true, criado_por_usuario: { select: { id: true, nome: true } } },
        },
        agenda_loja: {
          select: { id: true, titulo: true, categoria: true, criado_por_usuario: { select: { id: true, nome: true } } },
        },
        venda: { select: { id: true } },
      },
    });
  }

  /**
   * Retorna apontamentos + tarefas pendentes no período.
   * - tipo_agenda 'venda': reflete só a Agenda da Loja (pendentes = agenda_loja, pendentes_fabrica = []).
   * - tipo_agenda 'producao': reflete só a Agenda da Produção (pendentes = [], pendentes_fabrica = agenda_fabrica).
   * Se usuario for vendedor (não admin), retorna apenas dados dos seus clientes/vendas.
   */
  async getTimeline(filtros: {
    data_inicio?: string;
    data_fim?: string;
    tipo_agenda?: 'venda' | 'producao';
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null;
  }) {
    const [apontamentos, pendentesLoja, pendentesFabricaResult] = await Promise.all([
      this.findAll({
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim,
        tipo_agenda: filtros.tipo_agenda,
        usuario: filtros.usuario,
      }),
      filtros.tipo_agenda === 'venda'
        ? this.getPendentesAgendaLoja(filtros.data_inicio, filtros.data_fim, false, filtros.usuario)
        : Promise.resolve([]),
      filtros.tipo_agenda === 'producao'
        ? this.getPendentesAgendaFabrica(filtros.data_inicio, filtros.data_fim, filtros.usuario).catch(
            () => [] as Awaited<ReturnType<typeof this.getPendentesAgendaFabrica>>,
          )
        : Promise.resolve([]),
    ]);
    return {
      apontamentos,
      pendentes: pendentesLoja,
      pendentes_fabrica: pendentesFabricaResult,
    };
  }

  /**
   * Timeline por tarefas: lista de agendamentos no período, cada um com seus apontamentos (início/fim de cada funcionário).
   * Agenda = datas fixas da tarefa; Timeline = início e fim da hora de cada funcionário executando.
   * Se usuario for vendedor (não admin), retorna apenas tarefas dos seus clientes/vendas.
   */
  async getTimelinePorTarefas(filtros: {
    data_inicio?: string;
    data_fim?: string;
    tipo_agenda?: 'venda' | 'producao';
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null;
  }) {
    const dataInicio = filtros.data_inicio ? new Date(filtros.data_inicio + 'T00:00:00') : undefined;
    const dataFim = filtros.data_fim ? new Date(filtros.data_fim + 'T23:59:59') : undefined;
    const whereData = dataInicio || dataFim ? { inicio_em: {} as Record<string, Date> } : {};
    if (dataInicio) (whereData.inicio_em as Record<string, Date>).gte = dataInicio;
    if (dataFim) (whereData.inicio_em as Record<string, Date>).lte = dataFim;

    const funcionarioIdVendedor =
      filtros.usuario?.funcionario_id != null && !filtros.usuario?.is_admin
        ? Number(filtros.usuario.funcionario_id)
        : null;
    const whereVendedor =
      funcionarioIdVendedor != null
        ? this.whereVendedorAgenda(funcionarioIdVendedor)
        : null;

    if (filtros.tipo_agenda === 'venda') {
      // Timeline Vendas: exibe todos os agendamentos da agenda de venda no período (Orçamento, Apresentação, Contrato, Medição, etc.).
      const tarefas = await this.prisma.agenda_loja.findMany({
        where: {
          status: { notIn: ['CANCELADO', 'Cancelado', 'cancelado'] },
          ...whereData,
          ...(whereVendedor ? { AND: [whereVendedor] } : {}),
        },
        orderBy: { inicio_em: 'asc' },
        include: {
          cliente: { select: { id: true, nome_completo: true, razao_social: true } },
          criado_por_usuario: { select: { id: true, nome: true } },
          apontamentos_producao: {
            orderBy: { inicio_em: 'asc' },
            include: {
              funcionario: { select: { id: true, nome: true, custo_hora: true } },
            },
          },
        },
      });
      return { tarefas, tipo: 'venda' as const };
    }

    if (filtros.tipo_agenda === 'producao') {
      // Mesmas regras de visibilidade da Agenda de Produção: só tarefas que aparecem no calendário (venda vigente ou status/categoria que entram na agenda)
      const somentePainelCats = [...AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS];
      const statusSempreVisivel = AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL;
      const statusAgendado = AGENDA_FABRICA_STATUS_AGENDADO;
      const andProducao: any[] = [
        {
          OR: [
            { venda_id: null },
            { venda: { contratos: { some: { status: 'VIGENTE' } } } },
            { status: statusSempreVisivel },
          ],
        },
        {
          OR: [
            ...(somentePainelCats.length > 0 ? [{ categoria: { notIn: somentePainelCats } }] : []),
            { status: statusSempreVisivel },
            ...somentePainelCats.map((c) => ({ categoria: c, status: statusAgendado })),
          ],
        },
      ];
      // Serviço de Corte (plano_corte_id) sempre aparece na Timeline; vendedor vê só suas vendas OU qualquer Serviço de Corte
      if (whereVendedor) {
        andProducao.push({
          OR: [
            whereVendedor,
            { plano_corte_id: { not: null } },
          ],
        });
      }
      const whereProducao = {
        status: { notIn: ['CANCELADO', 'Cancelado', 'cancelado'] },
        ...whereData,
        AND: andProducao,
      };
      const tarefas = await this.prisma.agenda_fabrica.findMany({
        where: whereProducao,
        orderBy: { inicio_em: 'asc' },
        include: {
          cliente: { select: { id: true, nome_completo: true, razao_social: true } },
          criado_por_usuario: { select: { id: true, nome: true } },
          plano_corte: { select: { id: true, fornecedor_id: true, status: true } },
          apontamentos_producao: {
            orderBy: { inicio_em: 'asc' },
            include: {
              funcionario: { select: { id: true, nome: true, custo_hora: true } },
            },
          },
        },
      });
      return { tarefas, tipo: 'producao' as const };
    }

    return { tarefas: [], tipo: 'venda' as const };
  }

  /**
   * Tarefas da agenda_fabrica no período que ainda não possuem apontamento_producao.
   * Se usuario for vendedor (não admin), retorna apenas tarefas dos seus clientes/vendas.
   */
  private async getPendentesAgendaFabrica(
    dataInicio?: string,
    dataFim?: string,
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null,
  ) {
    const where: Record<string, unknown> = {
      status: { not: 'CANCELADO' },
      apontamentos_producao: { none: {} },
    };
    if (dataInicio || dataFim) {
      where.inicio_em = {};
      if (dataInicio) {
        (where.inicio_em as Record<string, Date>).gte = new Date(
          dataInicio + 'T00:00:00',
        );
      }
      if (dataFim) {
        (where.inicio_em as Record<string, Date>).lte = new Date(
          dataFim + 'T23:59:59',
        );
      }
    }
    const funcionarioIdVendedor =
      usuario?.funcionario_id != null && !usuario?.is_admin
        ? Number(usuario.funcionario_id)
        : null;
    if (funcionarioIdVendedor != null) {
      where.AND = [
        {
          OR: [
            this.whereVendedorAgenda(funcionarioIdVendedor),
            { plano_corte_id: { not: null } },
          ],
        },
      ];
    }
    return this.prisma.agenda_fabrica.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome_completo: true,
            razao_social: true,
          },
        },
        criado_por_usuario: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { inicio_em: 'asc' },
    });
  }

  /**
   * Tarefas da agenda_loja no período que ainda não possuem apontamento_producao.
   * Regra: Medição é sempre um funcionário da fábrica que vai medir (antes do orçamento). Outros casos = quando não tem medição.
   * @param onlyMedicao quando true (Timeline Produção), retorna só categorias de medição (MEDIDA).
   * Se usuario for vendedor (não admin), retorna apenas tarefas dos seus clientes/vendas.
   */
  private async getPendentesAgendaLoja(
    dataInicio?: string,
    dataFim?: string,
    onlyMedicao = false,
    usuario?: { funcionario_id?: number | null; is_admin?: boolean } | null,
  ) {
    const where: Record<string, unknown> = {
      status: { not: 'CANCELADO' },
      apontamentos_producao: { none: {} },
    };
    const funcionarioIdVendedor =
      usuario?.funcionario_id != null && !usuario?.is_admin
        ? Number(usuario.funcionario_id)
        : null;
    if (funcionarioIdVendedor != null) {
      where.AND = [this.whereVendedorAgenda(funcionarioIdVendedor)];
    }
    if (onlyMedicao) {
      where.categoria = { in: [...CATEGORIAS_AGENDA_LOJA_MEDICAO] };
    }
    if (dataInicio || dataFim) {
      where.inicio_em = {};
      if (dataInicio) {
        (where.inicio_em as Record<string, Date>).gte = new Date(
          dataInicio + 'T00:00:00',
        );
      }
      if (dataFim) {
        (where.inicio_em as Record<string, Date>).lte = new Date(
          dataFim + 'T23:59:59',
        );
      }
    }
    return this.prisma.agenda_loja.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome_completo: true,
            razao_social: true,
          },
        },
        criado_por_usuario: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { inicio_em: 'asc' },
    });
  }

  async getResumoPorAgenda(agendaFabricaIds: number[]) {
    if (!agendaFabricaIds.length) return {};
    const rows = await this.prisma.apontamento_producao.groupBy({
      by: ['agenda_fabrica_id'],
      where: { agenda_fabrica_id: { in: agendaFabricaIds.filter(Boolean) } },
      _sum: { custo_calculado: true },
      _count: true,
    });
    const horasPorAgenda = await this.prisma.apontamento_producao.findMany({
      where: { agenda_fabrica_id: { in: agendaFabricaIds.filter(Boolean) } },
      select: { agenda_fabrica_id: true, horas: true, inicio_em: true, fim_em: true },
    });
    const totalHorasPorId: Record<number, number> = {};
    for (const r of horasPorAgenda) {
      const id = r.agenda_fabrica_id!;
      const h = r.horas ? Number(r.horas) : (r.fim_em.getTime() - r.inicio_em.getTime()) / (1000 * 60 * 60);
      totalHorasPorId[id] = (totalHorasPorId[id] ?? 0) + h;
    }
    const res: Record<number, { totalHoras: number; totalCusto: number; quantidade: number }> = {};
    for (const r of rows) {
      const id = r.agenda_fabrica_id!;
      res[id] = {
        totalHoras: Math.round((totalHorasPorId[id] ?? 0) * 100) / 100,
        totalCusto: r._sum.custo_calculado ? Number(r._sum.custo_calculado) : 0,
        quantidade: r._count,
      };
    }
    return res;
  }

  async update(id: number, dto: UpdateApontamentoProducaoDto) {
    const existente = await this.prisma.apontamento_producao.findUnique({
      where: { id },
      select: {
        funcionario_id: true,
        inicio_em: true,
        fim_em: true,
        horas: true,
        pausa_inicio_em: true,
        pausa_fim_em: true,
      } as any,
    });
    if (!existente) return null;

    const exist = existente as typeof existente & { pausa_inicio_em?: Date | null; pausa_fim_em?: Date | null };
    const inicio = dto.inicio_em ? new Date(dto.inicio_em) : existente.inicio_em;
    const fim = dto.fim_em ? new Date(dto.fim_em) : existente.fim_em;
    const pausaInicio = dto.pausa_inicio_em != null ? new Date(dto.pausa_inicio_em) : exist.pausa_inicio_em;
    const pausaFim = dto.pausa_fim_em != null ? new Date(dto.pausa_fim_em) : exist.pausa_fim_em;
    const horas = dto.horas ?? this.calcularHoras(inicio, fim, pausaInicio, pausaFim);
    const funcionarioIdParaCusto = dto.funcionario_id ?? existente.funcionario_id;
    const custo_calculado = await this.calcularCusto(funcionarioIdParaCusto, horas);

    const data: Record<string, unknown> = {
      ...(dto.categoria !== undefined && { categoria: dto.categoria }),
      ...(dto.agenda_fabrica_id !== undefined && { agenda_fabrica_id: dto.agenda_fabrica_id }),
      ...(dto.agenda_loja_id !== undefined && { agenda_loja_id: dto.agenda_loja_id }),
      ...(dto.venda_id !== undefined && { venda_id: dto.venda_id }),
      ...(dto.funcionario_id !== undefined && { funcionario_id: dto.funcionario_id }),
      ...(dto.data && { data: new Date(dto.data) }),
      inicio_em: inicio,
      fim_em: fim,
      ...(dto.pausa_inicio_em !== undefined && { pausa_inicio_em: dto.pausa_inicio_em ? new Date(dto.pausa_inicio_em) : null }),
      ...(dto.pausa_fim_em !== undefined && { pausa_fim_em: dto.pausa_fim_em ? new Date(dto.pausa_fim_em) : null }),
      horas,
      custo_calculado,
      ...(dto.observacao !== undefined && { observacao: dto.observacao }),
    };

    return this.prisma.apontamento_producao.update({
      where: { id },
      data,
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: { select: { id: true, titulo: true, categoria: true } },
        agenda_loja: { select: { id: true, titulo: true, categoria: true } },
        venda: { select: { id: true } },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.apontamento_producao.delete({
      where: { id },
    });
  }

  /** Apontamento em andamento: fim_em igual ou quase igual a inicio_em (cronômetro ainda aberto). */
  private isEmAndamento(ap: { inicio_em: Date; fim_em: Date }): boolean {
    const diff = ap.fim_em.getTime() - ap.inicio_em.getTime();
    return diff >= 0 && diff < 3000; // até 3 segundos = placeholder
  }

  /**
   * Medições em andamento por cliente (Fluxo de Clientes).
   * Retorna, para cada cliente com apontamento de medição ativo (Início sem Fim), o executor e o início.
   */
  async getMedicaoEmAndamentoPorCliente(): Promise<
    Array<{
      cliente_id: number;
      funcionario_id: number;
      funcionario_nome: string;
      inicio_em: Date;
      pausa_total_segundos: number;
      pausa_inicio_em: Date | null;
    }>
  > {
    const list = await this.prisma.apontamento_producao.findMany({
      where: { agenda_loja_id: { not: null } },
      select: {
        inicio_em: true,
        fim_em: true,
        pausa_inicio_em: true,
        pausa_total_segundos: true,
        funcionario_id: true,
        funcionario: { select: { nome: true } },
        agenda_loja: {
          select: { cliente_id: true, categoria: true, criado_por_usuario_id: true },
        },
      },
    });
    const out: Array<{
      cliente_id: number;
      funcionario_id: number;
      funcionario_nome: string;
      inicio_em: Date;
      pausa_total_segundos: number;
      pausa_inicio_em: Date | null;
    }> = [];
    for (const ap of list) {
      const al = (ap as any).agenda_loja;
      if (!al?.cliente_id || !ehCategoriaMedida(al.categoria)) continue;
      if (!this.isEmAndamento(ap)) continue;
      const nome = (ap as any).funcionario?.nome ?? 'Funcionário';
      const funcionarioId = Number((ap as any).funcionario_id ?? 0);
      const pausaTotal = Number((ap as any).pausa_total_segundos ?? 0);
      const pausaInicio = (ap as any).pausa_inicio_em ?? null;
      out.push({
        cliente_id: al.cliente_id,
        funcionario_id: funcionarioId,
        funcionario_nome: nome,
        inicio_em: ap.inicio_em,
        pausa_total_segundos: pausaTotal,
        pausa_inicio_em: pausaInicio,
      });
    }
    return out;
  }

  /**
   * Cronômetros abertos (em andamento) de um funcionário – para exibir estado na agenda/timeline.
   */
  async getCronometrosAbertos(funcionarioId: number) {
    const list = await this.prisma.apontamento_producao.findMany({
      where: { funcionario_id: funcionarioId },
      orderBy: { inicio_em: 'desc' },
      take: 50,
      select: {
        id: true,
        agenda_loja_id: true,
        agenda_fabrica_id: true,
        funcionario_id: true,
        inicio_em: true,
        fim_em: true,
        pausa_inicio_em: true,
        pausa_fim_em: true,
        data: true,
        categoria: true,
      },
    });
    return list.filter((ap) => this.isEmAndamento(ap));
  }

  /**
   * Iniciar cronômetro: cria apontamento com inicio_em = agora, fim_em = inicio_em (placeholder).
   * Regra venda: agenda_loja_id; regra produção: agenda_fabrica_id.
   */
  async startCronometro(payload: {
    agenda_loja_id?: number;
    agenda_fabrica_id?: number;
    funcionario_id: number;
  }) {
    const { agenda_loja_id, agenda_fabrica_id, funcionario_id } = payload;
    if (!agenda_loja_id && !agenda_fabrica_id) {
      throw new BadRequestException('Informe agenda_loja_id ou agenda_fabrica_id.');
    }
    const agora = new Date();
    const dataDate = new Date(agora);
    dataDate.setHours(0, 0, 0, 0);
    let categoria: string | undefined;
    let venda_id: number | undefined;
    let cliente_id_loja: number | null = null;
    if (agenda_loja_id) {
      const ag = await this.prisma.agenda_loja.findUnique({
        where: { id: agenda_loja_id },
        select: { categoria: true, venda_id: true, cliente_id: true },
      });
      if (!ag) throw new BadRequestException('Agenda loja não encontrada.');
      categoria = ag.categoria ?? undefined;
      venda_id = ag.venda_id ?? undefined;
      cliente_id_loja = ag.cliente_id ?? null;
    } else if (agenda_fabrica_id) {
      const ag = await this.prisma.agenda_fabrica.findUnique({
        where: { id: agenda_fabrica_id },
        select: { categoria: true, venda_id: true },
      });
      if (!ag) throw new BadRequestException('Agenda fábrica não encontrada.');
      categoria = ag.categoria ?? undefined;
      venda_id = ag.venda_id ?? undefined;
    }
    const inicio = new Date(agora);
    const fimPlaceholder = new Date(inicio.getTime()); // fim = início = em andamento
    const custo_calculado = await this.calcularCusto(funcionario_id, 0);
    const apontamento = await this.prisma.apontamento_producao.create({
      data: {
        agenda_loja_id: agenda_loja_id ?? undefined,
        agenda_fabrica_id: agenda_fabrica_id ?? undefined,
        venda_id,
        funcionario_id,
        categoria,
        data: dataDate,
        inicio_em: inicio,
        fim_em: fimPlaceholder,
        horas: 0,
        custo_calculado,
      } as any,
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: { select: { id: true, titulo: true, categoria: true } },
        agenda_loja: { select: { id: true, titulo: true, categoria: true } },
        venda: { select: { id: true } },
      },
    });

    // Gatilho Fluxo de Clientes: ao dar Início na medição (Timeline), status do cliente → Medição em Andamento
    if (agenda_loja_id && cliente_id_loja && ehCategoriaMedida(categoria)) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: cliente_id_loja },
        select: { status: true },
      });
      if (
        cliente &&
        validarTransicaoStatusCliente({ atual: cliente.status, proximo: 'MEDIDA_EM_ANDAMENTO' }).ok
      ) {
        await this.prisma.cliente.update({
          where: { id: cliente_id_loja },
          data: { status: 'MEDIDA_EM_ANDAMENTO' },
        });
      }
    }

    return apontamento;
  }

  /**
   * Pausar cronômetro: define pausa_inicio_em = agora.
   * Se já existir uma pausa concluída (pausa_inicio + pausa_fim), soma esse intervalo em pausa_total_segundos e inicia nova pausa (permite pausar/retomar várias vezes).
   */
  async pauseCronometro(id: number) {
    const ap = await this.prisma.apontamento_producao.findUnique({
      where: { id },
      select: { inicio_em: true, fim_em: true, pausa_inicio_em: true, pausa_fim_em: true, pausa_total_segundos: true },
    });
    if (!ap) throw new BadRequestException('Apontamento não encontrado.');
    if (!this.isEmAndamento(ap)) throw new BadRequestException('Cronômetro já foi encerrado.');
    const apAny = ap as typeof ap & { pausa_inicio_em?: Date | null; pausa_fim_em?: Date | null; pausa_total_segundos?: number | null };
    if (apAny.pausa_inicio_em && !apAny.pausa_fim_em) throw new BadRequestException('Cronômetro já está pausado.');

    let pausaTotal = Number(apAny.pausa_total_segundos ?? 0);
    const data: { pausa_inicio_em: Date; pausa_fim_em: null; pausa_total_segundos?: number } = {
      pausa_inicio_em: new Date(),
      pausa_fim_em: null,
    };
    if (apAny.pausa_inicio_em && apAny.pausa_fim_em) {
      pausaTotal += (apAny.pausa_fim_em.getTime() - apAny.pausa_inicio_em.getTime()) / 1000;
      data.pausa_total_segundos = Math.round(pausaTotal * 100) / 100;
    }

    return this.prisma.apontamento_producao.update({
      where: { id },
      data,
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: { select: { id: true, titulo: true, categoria: true } },
        agenda_loja: { select: { id: true, titulo: true, categoria: true } },
        venda: { select: { id: true } },
      },
    });
  }

  /**
   * Retomar cronômetro: soma a pausa atual em pausa_total_segundos e limpa pausa_inicio_em/pausa_fim_em para permitir pausar de novo depois.
   */
  async resumeCronometro(id: number) {
    const ap = await this.prisma.apontamento_producao.findUnique({
      where: { id },
      select: { inicio_em: true, fim_em: true, pausa_inicio_em: true, pausa_fim_em: true, pausa_total_segundos: true },
    });
    if (!ap) throw new BadRequestException('Apontamento não encontrado.');
    if (!this.isEmAndamento(ap)) throw new BadRequestException('Cronômetro já foi encerrado.');
    const apAny = ap as typeof ap & { pausa_inicio_em?: Date | null; pausa_fim_em?: Date | null; pausa_total_segundos?: number | null };
    if (!apAny.pausa_inicio_em || apAny.pausa_fim_em) throw new BadRequestException('Cronômetro não está pausado.');

    const agora = new Date();
    let pausaTotal = Number(apAny.pausa_total_segundos ?? 0);
    pausaTotal += (agora.getTime() - apAny.pausa_inicio_em.getTime()) / 1000;

    return this.prisma.apontamento_producao.update({
      where: { id },
      data: {
        pausa_fim_em: agora,
        pausa_inicio_em: null,
        pausa_total_segundos: Math.round(pausaTotal * 100) / 100,
      },
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: { select: { id: true, titulo: true, categoria: true } },
        agenda_loja: { select: { id: true, titulo: true, categoria: true } },
        venda: { select: { id: true } },
      },
    });
  }

  /**
   * Concluir cronômetro: define fim_em = agora e recalcula horas/custo.
   * Não altera status do cliente nem da agenda: apenas registra o fim do apontamento (regra: só "Finalizar Etapa" encerra o ciclo).
   */
  async finishCronometro(id: number) {
    const ap = await this.prisma.apontamento_producao.findUnique({
      where: { id },
      select: {
        inicio_em: true,
        fim_em: true,
        pausa_inicio_em: true,
        pausa_fim_em: true,
        pausa_total_segundos: true,
        funcionario_id: true,
      },
    });
    if (!ap) throw new BadRequestException('Apontamento não encontrado.');
    if (!this.isEmAndamento(ap)) throw new BadRequestException('Cronômetro já foi encerrado.');
    const apAny = ap as typeof ap & { pausa_inicio_em?: Date | null; pausa_fim_em?: Date | null; pausa_total_segundos?: number | null };
    const fim = new Date();
    const pausaTotal = Number(apAny.pausa_total_segundos ?? 0);
    const pausaAtualInicio = apAny.pausa_inicio_em && !apAny.pausa_fim_em ? apAny.pausa_inicio_em : null;
    const horas = this.calcularHorasComPausas(ap.inicio_em, fim, pausaTotal, pausaAtualInicio);
    const custo_calculado = await this.calcularCusto(ap.funcionario_id, horas);

    return this.prisma.apontamento_producao.update({
      where: { id },
      data: { fim_em: fim, horas, custo_calculado },
      include: {
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: { select: { id: true, titulo: true, categoria: true } },
        agenda_loja: { select: { id: true, titulo: true, categoria: true } },
        venda: { select: { id: true } },
      },
    });
  }

  /**
   * Finalizar etapa: encerra o ciclo da tarefa (agenda + fluxo).
   * - Encerra todos os cronômetros em aberto dessa tarefa.
   * - Marca o evento da agenda como CONCLUIDO.
   * - Atualiza o status do cliente para a próxima fase (ex.: Medição → CRIAR_ORCAMENTO).
   * Somente este botão considera a etapa concluída; parar o cronômetro apenas registra horas.
   */
  async finalizarEtapa(payload: { agenda_loja_id?: number; agenda_fabrica_id?: number }) {
    const { agenda_loja_id, agenda_fabrica_id } = payload;
    if (!agenda_loja_id && !agenda_fabrica_id) {
      throw new BadRequestException('Informe agenda_loja_id ou agenda_fabrica_id.');
    }

    const agora = new Date();

    if (agenda_loja_id) {
      const agenda = await this.prisma.agenda_loja.findUnique({
        where: { id: agenda_loja_id },
        select: { id: true, status: true, categoria: true, cliente_id: true },
      });
      if (!agenda) throw new BadRequestException('Agenda loja não encontrada.');
      if (String(agenda.status).toUpperCase() === 'CONCLUIDO') {
        return { ok: true, mensagem: 'Etapa já estava concluída.' };
      }

      const abertos = await this.prisma.apontamento_producao.findMany({
        where: { agenda_loja_id },
        select: {
          id: true,
          inicio_em: true,
          fim_em: true,
          pausa_inicio_em: true,
          pausa_fim_em: true,
          pausa_total_segundos: true,
          funcionario_id: true,
        },
      });
      for (const ap of abertos) {
        if (this.isEmAndamento(ap)) {
          const apAny = ap as typeof ap & { pausa_inicio_em?: Date | null; pausa_fim_em?: Date | null; pausa_total_segundos?: number | null };
          const pausaTotal = Number(apAny.pausa_total_segundos ?? 0);
          const pausaAtualInicio = apAny.pausa_inicio_em && !apAny.pausa_fim_em ? apAny.pausa_inicio_em : null;
          const horas = this.calcularHorasComPausas(ap.inicio_em, agora, pausaTotal, pausaAtualInicio);
          const custo_calculado = await this.calcularCusto(ap.funcionario_id, horas);
          await this.prisma.apontamento_producao.update({
            where: { id: ap.id },
            data: { fim_em: agora, horas, custo_calculado },
          });
        }
      }

      await this.prisma.agenda_loja.update({
        where: { id: agenda_loja_id },
        data: { status: 'CONCLUIDO', alterado_em: agora },
      });

      let mensagemVendedor: string | null = null;
      if (agenda.cliente_id && ehCategoriaMedida(agenda.categoria)) {
        const cliente = await this.prisma.cliente.findUnique({
          where: { id: agenda.cliente_id },
          select: { status: true },
        });
        if (
          cliente &&
          validarTransicaoStatusCliente({ atual: cliente.status, proximo: 'CRIAR_ORCAMENTO' }).ok
        ) {
          await this.prisma.cliente.update({
            where: { id: agenda.cliente_id },
            data: { status: 'CRIAR_ORCAMENTO' },
          });
          const c = await this.prisma.cliente.findUnique({
            where: { id: agenda.cliente_id },
            select: { nome_completo: true, razao_social: true },
          });
          const nomeCliente = c?.nome_completo || c?.razao_social || 'Cliente';
          mensagemVendedor = `Medição concluída para ${nomeCliente}. Pronto para elaborar orçamento (7 dias úteis).`;
        }
      }

      return { ok: true, agenda_loja_id, mensagem_vendedor: mensagemVendedor };
    }

    if (agenda_fabrica_id) {
      const agenda = await this.prisma.agenda_fabrica.findUnique({
        where: { id: agenda_fabrica_id },
        select: { id: true, status: true },
      });
      if (!agenda) throw new BadRequestException('Agenda fábrica não encontrada.');
      if (String(agenda.status).toUpperCase() === 'CONCLUIDO') {
        return { ok: true, mensagem: 'Etapa já estava concluída.' };
      }

      const abertos = await this.prisma.apontamento_producao.findMany({
        where: { agenda_fabrica_id },
        select: {
          id: true,
          inicio_em: true,
          fim_em: true,
          pausa_inicio_em: true,
          pausa_fim_em: true,
          pausa_total_segundos: true,
          funcionario_id: true,
        },
      });
      for (const ap of abertos) {
        if (this.isEmAndamento(ap)) {
          const apAny = ap as typeof ap & { pausa_inicio_em?: Date | null; pausa_fim_em?: Date | null; pausa_total_segundos?: number | null };
          const pausaTotal = Number(apAny.pausa_total_segundos ?? 0);
          const pausaAtualInicio = apAny.pausa_inicio_em && !apAny.pausa_fim_em ? apAny.pausa_inicio_em : null;
          const horas = this.calcularHorasComPausas(ap.inicio_em, agora, pausaTotal, pausaAtualInicio);
          const custo_calculado = await this.calcularCusto(ap.funcionario_id, horas);
          await this.prisma.apontamento_producao.update({
            where: { id: ap.id },
            data: { fim_em: agora, horas, custo_calculado },
          });
        }
      }

      await this.prisma.agenda_fabrica.update({
        where: { id: agenda_fabrica_id },
        data: { status: 'CONCLUIDO', alterado_em: agora },
      });

      return { ok: true, agenda_fabrica_id };
    }

    return { ok: true };
  }
}
