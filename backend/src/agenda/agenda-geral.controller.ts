import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissoes } from '../auth/permissoes.decorator';
import {
  SUBETAPAS_CATALOGO,
  MACRO_ETAPAS,
} from '../shared/constantes/status-matrix';

function queryTruthy(v?: string): boolean {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

/**
 * Agenda Geral: visão operacional consolidada de TODOS os clientes + etapas.
 * Puxa agenda_loja + agenda_fabrica e agrupa por macroetapa → subetapa → cliente.
 */
@UseGuards(PermissionsGuard)
@Controller('agenda-geral')
export class AgendaGeralController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissoes('agendamentos.ver')
  async findAll(
    @Query('macroetapa') macroetapaFiltro?: string,
    @Query('subetapa') subetapaFiltro?: string,
    @Query('execucao_etapa') execucaoFiltro?: string,
    @Query('cliente_id') clienteId?: string,
    @Query('funcionario_id') funcionarioId?: string,
    @Query('busca') busca?: string,
    @Query('somente_arquivo') somenteArquivoRaw?: string,
    @Query('periodo_inicio') periodoInicioIso?: string,
    @Query('periodo_fim') periodoFimIso?: string,
  ) {
    const baseWhere: any = {
      status: { not: 'CANCELADO' },
    };
    if (macroetapaFiltro) baseWhere.macroetapa = macroetapaFiltro.toUpperCase();
    if (subetapaFiltro) baseWhere.subetapa = subetapaFiltro.toUpperCase();
    if (execucaoFiltro) baseWhere.execucao_etapa = execucaoFiltro.toUpperCase();
    if (clienteId) baseWhere.cliente_id = Number(clienteId);

    const whereFuncionario = funcionarioId
      ? { equipe: { some: { funcionario_id: Number(funcionarioId) } } }
      : {};

    const whereBusca = busca
      ? {
          OR: [
            { titulo: { contains: busca } },
            { cliente: { nome_completo: { contains: busca } } },
            { cliente: { razao_social: { contains: busca } } },
          ],
        }
      : {};

    const andParts: any[] = [baseWhere];
    if (queryTruthy(somenteArquivoRaw)) {
      andParts.push({ arquivado_em: { not: null } });
    } else {
      andParts.push({ arquivado_em: null });
    }
    if (periodoInicioIso && periodoFimIso) {
      const ini = new Date(periodoInicioIso);
      const fim = new Date(periodoFimIso);
      if (!Number.isNaN(ini.getTime()) && !Number.isNaN(fim.getTime())) {
        andParts.push({ inicio_em: { gte: ini, lte: fim } });
      }
    }
    if (Object.keys(whereFuncionario).length) andParts.push(whereFuncionario);
    if (Object.keys(whereBusca).length) andParts.push(whereBusca);

    const whereAgenda = andParts.length > 1 ? { AND: andParts } : andParts[0];

    const includeBase = {
      cliente: { select: { id: true, nome_completo: true, razao_social: true, telefone: true } },
      venda: { select: { id: true, status: true, valor_total: true } },
      equipe: { include: { funcionario: { select: { id: true, nome: true, custo_hora: true } } } },
    };

    const includeApontamento = {
      apontamentos_producao: {
        select: {
          id: true,
          funcionario_id: true,
          inicio_em: true,
          fim_em: true,
          pausa_inicio_em: true,
          pausa_total_segundos: true,
          horas: true,
          custo_calculado: true,
          observacao: true,
          categoria: true,
          funcionario: { select: { id: true, nome: true } },
        },
        orderBy: { inicio_em: 'desc' as const },
      },
    };

    const [loja, fabrica] = await Promise.all([
      this.prisma.agenda_loja.findMany({
        where: whereAgenda,
        include: {
          ...includeBase,
          ...includeApontamento,
          orcamento: { select: { id: true } },
        },
        orderBy: { inicio_em: 'asc' },
      }),
      this.prisma.agenda_fabrica.findMany({
        where: whereAgenda,
        include: {
          ...includeBase,
          ...includeApontamento,
          plano_corte: { select: { id: true, status: true } },
        },
        orderBy: { inicio_em: 'asc' },
      }),
    ]);

    // Unificar eventos com campo _setor
    const todos = [
      ...loja.map((ev: any) => ({ ...ev, _setor: 'LOJA' })),
      ...fabrica.map((ev: any) => ({ ...ev, _setor: 'FABRICA' })),
    ];

    return {
      total: todos.length,
      catalogo_subetapas: SUBETAPAS_CATALOGO,
      macro_etapas: MACRO_ETAPAS,
      eventos: todos,
    };
  }

  /** Retorna contadores agrupados por macroetapa + subetapa + execução. */
  @Get('resumo')
  @Permissoes('agendamentos.ver')
  async resumo() {
    const [lojaRaw, fabricaRaw] = await Promise.all([
      this.prisma.agenda_loja.groupBy({
        by: ['macroetapa', 'subetapa', 'execucao_etapa'],
        where: { status: { not: 'CANCELADO' }, macroetapa: { not: null } },
        _count: { id: true },
      }),
      this.prisma.agenda_fabrica.groupBy({
        by: ['macroetapa', 'subetapa', 'execucao_etapa'],
        where: { status: { not: 'CANCELADO' }, macroetapa: { not: null } },
        _count: { id: true },
      }),
    ]);

    const mapa: Record<string, { macroetapa: string; subetapa: string; execucao_etapa: string; total: number }> = {};

    for (const row of [...lojaRaw, ...fabricaRaw]) {
      const key = `${row.macroetapa}|${row.subetapa}|${row.execucao_etapa}`;
      if (!mapa[key]) {
        mapa[key] = {
          macroetapa: row.macroetapa || '',
          subetapa: row.subetapa || '',
          execucao_etapa: row.execucao_etapa || '',
          total: 0,
        };
      }
      mapa[key].total += row._count.id;
    }

    return Object.values(mapa);
  }
}
