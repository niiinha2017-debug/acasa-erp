import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RelatorioTotemService {
  constructor(private readonly prisma: PrismaService) {}

  async getRelatorio(dataInicio?: string, dataFim?: string) {
    const hoje = new Date();
    const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`) : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = dataFim ? new Date(`${dataFim}T23:59:59.999`) : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

    const apontamentos = await this.prisma.apontamento_producao.findMany({
      where: {
        inicio_em: { gte: inicio, lte: fim },
      },
      select: {
        id: true,
        funcionario_id: true,
        inicio_em: true,
        fim_em: true,
        horas: true,
        custo_calculado: true,
        pausa_total_segundos: true,
        pausa_inicio_em: true,
        pausa_fim_em: true,
        agenda_fabrica_id: true,
        agenda_loja_id: true,
        funcionario: { select: { id: true, nome: true, custo_hora: true } },
        agenda_fabrica: {
          select: {
            id: true,
            titulo: true,
            categoria: true,
            subetapa: true,
            execucao_etapa: true,
            status: true,
            totem_concluido_em: true,
            cliente: { select: { id: true, nome_completo: true, razao_social: true } },
          },
        },
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            categoria: true,
            subetapa: true,
            execucao_etapa: true,
            status: true,
            cliente: { select: { id: true, nome_completo: true, razao_social: true } },
          },
        },
      },
      orderBy: { inicio_em: 'asc' },
    });

    // Agregar por funcionário
    const porFuncionario = new Map<number, {
      funcionario_id: number;
      nome: string;
      custo_hora: number;
      total_horas: number;
      total_custo: number;
      total_apontamentos: number;
      tarefas: Set<string>;
    }>();

    // Agregar por tarefa
    const porTarefa = new Map<string, {
      chave: string;
      tipo: string;
      id: number;
      titulo: string;
      subetapa: string | null;
      status: string | null;
      cliente_nome: string | null;
      total_horas: number;
      total_custo: number;
      funcionarios: Map<number, { nome: string; horas: number; custo: number }>;
    }>();

    let totalHoras = 0;
    let totalCusto = 0;
    let totalApontamentos = apontamentos.length;

    for (const ap of apontamentos) {
      const horas = this.calcularHoras(ap);
      const custoCalc = Number(ap.custo_calculado) || 0;
      const custo = custoCalc > 0 ? custoCalc : horas * (Number(ap.funcionario?.custo_hora) || 0);

      totalHoras += horas;
      totalCusto += custo;

      // Por funcionário
      const funcId = ap.funcionario_id;
      if (funcId) {
        if (!porFuncionario.has(funcId)) {
          porFuncionario.set(funcId, {
            funcionario_id: funcId,
            nome: ap.funcionario?.nome || 'Funcionário',
            custo_hora: Number(ap.funcionario?.custo_hora) || 0,
            total_horas: 0,
            total_custo: 0,
            total_apontamentos: 0,
            tarefas: new Set(),
          });
        }
        const f = porFuncionario.get(funcId)!;
        f.total_horas += horas;
        f.total_custo += custo;
        f.total_apontamentos += 1;

        const tarefaKey = ap.agenda_fabrica_id
          ? `fabrica:${ap.agenda_fabrica_id}`
          : ap.agenda_loja_id
            ? `loja:${ap.agenda_loja_id}`
            : null;
        if (tarefaKey) f.tarefas.add(tarefaKey);
      }

      // Por tarefa
      const agenda = ap.agenda_fabrica || ap.agenda_loja;
      const tipo = ap.agenda_fabrica_id ? 'agenda_fabrica' : 'agenda_loja';
      const agendaId = ap.agenda_fabrica_id || ap.agenda_loja_id;
      if (agenda && agendaId) {
        const chave = `${tipo}:${agendaId}`;
        if (!porTarefa.has(chave)) {
          const cli = agenda.cliente;
          porTarefa.set(chave, {
            chave,
            tipo,
            id: agendaId,
            titulo: agenda.titulo || `Tarefa #${agendaId}`,
            subetapa: agenda.subetapa || null,
            status: agenda.status || null,
            cliente_nome: cli?.nome_completo || cli?.razao_social || null,
            total_horas: 0,
            total_custo: 0,
            funcionarios: new Map(),
          });
        }
        const t = porTarefa.get(chave)!;
        t.total_horas += horas;
        t.total_custo += custo;

        if (funcId) {
          if (!t.funcionarios.has(funcId)) {
            t.funcionarios.set(funcId, { nome: ap.funcionario?.nome || 'Funcionário', horas: 0, custo: 0 });
          }
          const tf = t.funcionarios.get(funcId)!;
          tf.horas += horas;
          tf.custo += custo;
        }
      }
    }

    // Status consolidados
    const tarefasConcluidas = [...porTarefa.values()].filter(
      (t) => t.status === 'CONCLUIDO',
    ).length;
    const tarefasEmProducao = [...porTarefa.values()].filter(
      (t) => t.status === 'EM_PRODUCAO' || t.status === 'EM_ANDAMENTO',
    ).length;
    const tarefasPendentes = [...porTarefa.values()].filter(
      (t) => t.status === 'PENDENTE',
    ).length;

    return {
      periodo: {
        data_inicio: inicio.toISOString(),
        data_fim: fim.toISOString(),
      },
      resumo: {
        total_horas: this.round2(totalHoras),
        total_custo: this.round2(totalCusto),
        total_apontamentos: totalApontamentos,
        total_tarefas: porTarefa.size,
        total_funcionarios: porFuncionario.size,
        tarefas_concluidas: tarefasConcluidas,
        tarefas_em_producao: tarefasEmProducao,
        tarefas_pendentes: tarefasPendentes,
      },
      funcionarios: [...porFuncionario.values()]
        .map((f) => ({
          funcionario_id: f.funcionario_id,
          nome: f.nome,
          custo_hora: this.round2(f.custo_hora),
          total_horas: this.round2(f.total_horas),
          total_custo: this.round2(f.total_custo),
          total_apontamentos: f.total_apontamentos,
          total_tarefas: f.tarefas.size,
        }))
        .sort((a, b) => b.total_horas - a.total_horas),
      tarefas: [...porTarefa.values()]
        .map((t) => ({
          tipo: t.tipo,
          id: t.id,
          titulo: t.titulo,
          subetapa: t.subetapa,
          status: t.status,
          cliente_nome: t.cliente_nome,
          total_horas: this.round2(t.total_horas),
          total_custo: this.round2(t.total_custo),
          funcionarios: [...t.funcionarios.values()].map((f) => ({
            nome: f.nome,
            horas: this.round2(f.horas),
            custo: this.round2(f.custo),
          })),
        }))
        .sort((a, b) => b.total_horas - a.total_horas),
    };
  }

  private calcularHoras(ap: {
    inicio_em: Date | null;
    fim_em: Date | null;
    horas?: any;
    pausa_total_segundos?: number | null;
    pausa_inicio_em?: Date | null;
    pausa_fim_em?: Date | null;
  }): number {
    const horasDecimal = Number(ap.horas) || 0;
    if (horasDecimal > 0) return horasDecimal;

    if (!ap.inicio_em) return 0;
    const inicio = new Date(ap.inicio_em).getTime();
    if (Number.isNaN(inicio)) return 0;

    let fim = Date.now();
    if (ap.fim_em) {
      const fimReal = new Date(ap.fim_em).getTime();
      const diff = fimReal - inicio;
      if (!Number.isNaN(fimReal) && diff >= 3000) {
        fim = fimReal;
      }
    }
    if (Number.isNaN(fim) || fim <= inicio) return 0;

    let pausadoMs = (Number(ap.pausa_total_segundos) || 0) * 1000;
    if (ap.pausa_inicio_em && !ap.pausa_fim_em) {
      const pausaInicio = new Date(ap.pausa_inicio_em).getTime();
      if (!Number.isNaN(pausaInicio) && fim > pausaInicio) {
        pausadoMs += fim - pausaInicio;
      }
    }

    return Math.max(0, (fim - inicio - pausadoMs) / 3600000);
  }

  private round2(v: number): number {
    return Math.round(v * 100) / 100;
  }
}
