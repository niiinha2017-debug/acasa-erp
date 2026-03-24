import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildTwinEntityStatus,
  shouldStartFactoryFlowFromStoreStatus,
  type IEntityStatus,
  type TwinFlowContext,
  type TwinFlowScheduleType,
} from '../shared/constantes/twin-flow';

type TwinFlowViewer = {
  funcionario_id?: number | null;
  is_admin?: boolean;
  permissoes?: string[] | null;
};

@Injectable()
export class TwinFlowService {
  constructor(private readonly prisma: PrismaService) {}

  private getViewerPermissions(user?: TwinFlowViewer | null): string[] {
    return Array.isArray(user?.permissoes)
      ? user!.permissoes!.map((item) => String(item || '').trim().toUpperCase()).filter(Boolean)
      : [];
  }

  private resolveAllowedContexts(user?: TwinFlowViewer | null): TwinFlowContext[] {
    const perms = this.getViewerPermissions(user);
    if (user?.is_admin || perms.includes('ADMIN')) return ['STORE', 'FACTORY'];

    const contexts: TwinFlowContext[] = [];
    if (perms.includes('AGENDAMENTOS.VENDAS')) contexts.push('STORE');
    if (perms.includes('AGENDAMENTOS.PRODUCAO')) contexts.push('FACTORY');
    return contexts;
  }

  private fluxoTable(tx: any = this.prisma) {
    return tx['fluxo_entidade'];
  }

  private historicoTable(tx: any = this.prisma) {
    return tx['fluxo_entidade_historico'];
  }

  private agendaLinkTable(tx: any = this.prisma) {
    return tx['fluxo_entidade_agendamento'];
  }

  private async localizarFluxo(tx: any, params: {
    context: TwinFlowContext;
    vendaId?: number | null;
    orcamentoId?: number | null;
    clienteId?: number | null;
  }) {
    const or: Array<Record<string, unknown>> = [];
    if (params.vendaId) or.push({ venda_id: params.vendaId });
    if (params.orcamentoId) or.push({ orcamento_id: params.orcamentoId });
    if (params.clienteId) or.push({ cliente_id: params.clienteId });
    if (!or.length) return null;

    return this.fluxoTable(tx).findFirst({
      where: {
        contexto: params.context,
        OR: or,
      },
      orderBy: [
        { venda_id: 'desc' },
        { orcamento_id: 'desc' },
        { atualizado_em: 'desc' },
      ],
    });
  }

  private snapshotMudou(atual: any, next: IEntityStatus): boolean {
    if (!atual) return true;
    return String(atual.status || '') !== String(next.status || '')
      || String(atual.subetapa || '') !== String(next.subStep || '')
      || String(atual.macroetapa || '') !== String(next.macroStage || '')
      || String(atual.execucao_etapa || '') !== String(next.executionStatus || '')
      || String(atual.label_etapa || '') !== String(next.stepLabel || '')
      || Number(atual.ordem_etapa || 0) !== Number(next.order || 0)
      || Boolean(atual.terminal) !== Boolean(next.terminal);
  }

  private async registrarHistorico(tx: any, params: {
    fluxoId: number;
    context: TwinFlowContext;
    anterior?: any;
    snapshot: IEntityStatus;
    actorUserId?: number | null;
    source?: string | null;
    reason?: string | null;
    scheduleType?: TwinFlowScheduleType | null;
    scheduleId?: number | null;
    payload?: Record<string, unknown> | null;
  }) {
    await this.historicoTable(tx).create({
      data: {
        fluxo_entidade_id: params.fluxoId,
        contexto: params.context,
        status_anterior: params.anterior?.status ?? null,
        subetapa_anterior: params.anterior?.subetapa ?? null,
        execucao_anterior: params.anterior?.execucao_etapa ?? null,
        status: params.snapshot.status,
        subetapa: params.snapshot.subStep,
        macroetapa: params.snapshot.macroStage,
        execucao_etapa: params.snapshot.executionStatus,
        label_etapa: params.snapshot.stepLabel,
        ordem_etapa: params.snapshot.order,
        origem_evento: params.source ?? null,
        motivo: params.reason ?? null,
        agenda_tipo: params.scheduleType ?? null,
        agenda_id: params.scheduleId ?? null,
        payload: params.payload ?? null,
        criado_por_usuario_id: params.actorUserId ?? null,
      },
    });
  }

  private async upsertAgendaLink(tx: any, params: {
    fluxoId: number;
    context: TwinFlowContext;
    scheduleType: TwinFlowScheduleType;
    scheduleId: number;
    schedule: any;
  }) {
    const tabela = this.agendaLinkTable(tx);
    const existente = await tabela.findFirst({
      where: {
        agenda_tipo: params.scheduleType,
        agenda_id: params.scheduleId,
      },
    });
    const payload = {
      fluxo_entidade_id: params.fluxoId,
      contexto: params.context,
      agenda_tipo: params.scheduleType,
      agenda_id: params.scheduleId,
      titulo: params.schedule?.titulo ?? null,
      inicio_em: params.schedule?.inicio_em ?? null,
      fim_em: params.schedule?.fim_em ?? null,
      status: params.schedule?.status ?? null,
      subetapa: params.schedule?.subetapa ?? null,
      execucao_etapa: params.schedule?.execucao_etapa ?? null,
    };
    if (existente) {
      await tabela.update({ where: { id: existente.id }, data: payload });
      return;
    }
    await tabela.create({ data: payload });
  }

  private async garantirFluxoFabricaIniciado(tx: any, params: {
    clienteId?: number | null;
    vendaId?: number | null;
    orcamentoId?: number | null;
    actorUserId?: number | null;
    triggeredByFlowId?: number | null;
    reason?: string | null;
  }) {
    const existente = await this.localizarFluxo(tx, {
      context: 'FACTORY',
      vendaId: params.vendaId,
      orcamentoId: params.orcamentoId,
      clienteId: params.clienteId,
    });
    if (existente) return existente;

    const snapshot = buildTwinEntityStatus({
      context: 'FACTORY',
      status: 'PENDENTE',
      subStep: 'PRODUCAO',
      executionStatus: 'PENDENTE',
    });

    const created = await this.fluxoTable(tx).create({
      data: {
        contexto: 'FACTORY',
        cliente_id: params.clienteId ?? null,
        venda_id: params.vendaId ?? null,
        orcamento_id: params.orcamentoId ?? null,
        disparado_por_fluxo_id: params.triggeredByFlowId ?? null,
        status: snapshot.status,
        subetapa: snapshot.subStep,
        macroetapa: snapshot.macroStage,
        execucao_etapa: snapshot.executionStatus,
        label_etapa: snapshot.stepLabel,
        ordem_etapa: snapshot.order,
        terminal: snapshot.terminal,
        origem_evento: 'STORE_GATE',
        ultimo_snapshot: snapshot as any,
      },
    });

    await this.registrarHistorico(tx, {
      fluxoId: created.id,
      context: 'FACTORY',
      snapshot,
      actorUserId: params.actorUserId ?? null,
      source: 'STORE_GATE',
      reason: params.reason ?? 'Fluxo da fábrica iniciado automaticamente pelo fechamento da loja.',
      payload: { gate: 'STORE_GATE' },
    });

    return created;
  }

  async syncAgendaFlow(tx: any = this.prisma, params: {
    context: TwinFlowContext;
    scheduleType: TwinFlowScheduleType;
    scheduleId: number;
    schedule: any;
    actorUserId?: number | null;
    source?: string | null;
    reason?: string | null;
  }) {
    const snapshot = buildTwinEntityStatus({
      context: params.context,
      status: params.schedule?.status,
      subStep: params.schedule?.subetapa,
      macroStage: params.schedule?.macroetapa,
      executionStatus: params.schedule?.execucao_etapa,
      sourceType: params.scheduleType,
      sourceId: params.scheduleId,
    });

    const atual = await this.localizarFluxo(tx, {
      context: params.context,
      vendaId: params.schedule?.venda_id ?? null,
      orcamentoId: params.schedule?.orcamento_id ?? null,
      clienteId: params.schedule?.cliente_id ?? null,
    });

    let fluxo = atual;
    if (!fluxo) {
      fluxo = await this.fluxoTable(tx).create({
        data: {
          contexto: params.context,
          cliente_id: params.schedule?.cliente_id ?? null,
          venda_id: params.schedule?.venda_id ?? null,
          orcamento_id: params.schedule?.orcamento_id ?? null,
          status: snapshot.status,
          subetapa: snapshot.subStep,
          macroetapa: snapshot.macroStage,
          execucao_etapa: snapshot.executionStatus,
          label_etapa: snapshot.stepLabel,
          ordem_etapa: snapshot.order,
          terminal: snapshot.terminal,
          origem_evento: params.source ?? null,
          ultimo_agendamento_tipo: params.scheduleType,
          ultimo_agendamento_id: params.scheduleId,
          ultimo_snapshot: snapshot as any,
          concluido_em: snapshot.terminal || snapshot.status === 'CONCLUIDO' ? new Date() : null,
        },
      });
      await this.registrarHistorico(tx, {
        fluxoId: fluxo.id,
        context: params.context,
        snapshot,
        actorUserId: params.actorUserId ?? null,
        source: params.source ?? 'AGENDA_SYNC',
        reason: params.reason ?? 'Fluxo inicializado a partir do agendamento.',
        scheduleType: params.scheduleType,
        scheduleId: params.scheduleId,
        payload: { scheduleType: params.scheduleType, scheduleId: params.scheduleId },
      });
    } else if (this.snapshotMudou(fluxo, snapshot)) {
      await this.fluxoTable(tx).update({
        where: { id: fluxo.id },
        data: {
          cliente_id: params.schedule?.cliente_id ?? fluxo.cliente_id ?? null,
          venda_id: params.schedule?.venda_id ?? fluxo.venda_id ?? null,
          orcamento_id: params.schedule?.orcamento_id ?? fluxo.orcamento_id ?? null,
          status: snapshot.status,
          subetapa: snapshot.subStep,
          macroetapa: snapshot.macroStage,
          execucao_etapa: snapshot.executionStatus,
          label_etapa: snapshot.stepLabel,
          ordem_etapa: snapshot.order,
          terminal: snapshot.terminal,
          origem_evento: params.source ?? fluxo.origem_evento ?? null,
          ultimo_agendamento_tipo: params.scheduleType,
          ultimo_agendamento_id: params.scheduleId,
          ultimo_snapshot: snapshot as any,
          concluido_em: snapshot.terminal || snapshot.status === 'CONCLUIDO' ? new Date() : null,
        },
      });
      await this.registrarHistorico(tx, {
        fluxoId: fluxo.id,
        context: params.context,
        anterior: fluxo,
        snapshot,
        actorUserId: params.actorUserId ?? null,
        source: params.source ?? 'AGENDA_SYNC',
        reason: params.reason ?? 'Fluxo atualizado a partir do agendamento.',
        scheduleType: params.scheduleType,
        scheduleId: params.scheduleId,
        payload: { scheduleType: params.scheduleType, scheduleId: params.scheduleId },
      });
    }

    await this.upsertAgendaLink(tx, {
      fluxoId: fluxo.id,
      context: params.context,
      scheduleType: params.scheduleType,
      scheduleId: params.scheduleId,
      schedule: params.schedule,
    });

    if (params.context === 'STORE' && shouldStartFactoryFlowFromStoreStatus(snapshot)) {
      await this.garantirFluxoFabricaIniciado(tx, {
        clienteId: params.schedule?.cliente_id ?? null,
        vendaId: params.schedule?.venda_id ?? null,
        orcamentoId: params.schedule?.orcamento_id ?? null,
        actorUserId: params.actorUserId ?? null,
        triggeredByFlowId: fluxo.id,
        reason: 'Fechamento da loja atingiu o gatilho de início da fábrica.',
      });
    }

    return fluxo;
  }

  async syncVendaTwinFlows(vendaId: number) {
    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      include: {
        orcamento: { select: { id: true } },
        agendamentos_loja: {
          where: { status: { not: 'CANCELADO' } },
          orderBy: { atualizado_em: 'desc' },
          select: {
            id: true,
            titulo: true,
            inicio_em: true,
            fim_em: true,
            status: true,
            subetapa: true,
            macroetapa: true,
            execucao_etapa: true,
            cliente_id: true,
            venda_id: true,
            orcamento_id: true,
          },
        },
        agendamentos_fabrica: {
          where: { status: { not: 'CANCELADO' } },
          orderBy: { atualizado_em: 'desc' },
          select: {
            id: true,
            titulo: true,
            inicio_em: true,
            fim_em: true,
            status: true,
            subetapa: true,
            macroetapa: true,
            execucao_etapa: true,
            cliente_id: true,
            venda_id: true,
            orcamento_id: true,
          },
        },
      },
    });

    if (!venda) throw new NotFoundException('Venda não encontrada para sincronizar fluxo gêmeo.');

    await this.prisma.$transaction(async (tx) => {
      const snapshotLoja = buildTwinEntityStatus({
        context: 'STORE',
        status: venda.status,
        subStep: null,
        executionStatus: null,
      });

      const atualLoja = await this.localizarFluxo(tx, {
        context: 'STORE',
        vendaId: venda.id,
        orcamentoId: venda.orcamento?.id ?? null,
        clienteId: venda.cliente_id ?? null,
      });

      let fluxoLoja = atualLoja;
      if (!fluxoLoja) {
        fluxoLoja = await this.fluxoTable(tx).create({
          data: {
            contexto: 'STORE',
            cliente_id: venda.cliente_id ?? null,
            venda_id: venda.id,
            orcamento_id: venda.orcamento?.id ?? null,
            status: snapshotLoja.status,
            subetapa: snapshotLoja.subStep,
            macroetapa: snapshotLoja.macroStage,
            execucao_etapa: snapshotLoja.executionStatus,
            label_etapa: snapshotLoja.stepLabel,
            ordem_etapa: snapshotLoja.order,
            terminal: snapshotLoja.terminal,
            origem_evento: 'VENDA_SYNC',
            ultimo_snapshot: snapshotLoja as any,
          },
        });
        await this.registrarHistorico(tx, {
          fluxoId: fluxoLoja.id,
          context: 'STORE',
          snapshot: snapshotLoja,
          source: 'VENDA_SYNC',
          reason: 'Fluxo da loja sincronizado a partir da venda.',
          payload: { vendaId: venda.id },
        });
      } else if (this.snapshotMudou(fluxoLoja, snapshotLoja)) {
        await this.fluxoTable(tx).update({
          where: { id: fluxoLoja.id },
          data: {
            status: snapshotLoja.status,
            subetapa: snapshotLoja.subStep,
            macroetapa: snapshotLoja.macroStage,
            execucao_etapa: snapshotLoja.executionStatus,
            label_etapa: snapshotLoja.stepLabel,
            ordem_etapa: snapshotLoja.order,
            terminal: snapshotLoja.terminal,
            origem_evento: 'VENDA_SYNC',
            ultimo_snapshot: snapshotLoja as any,
          },
        });
        await this.registrarHistorico(tx, {
          fluxoId: fluxoLoja.id,
          context: 'STORE',
          anterior: fluxoLoja,
          snapshot: snapshotLoja,
          source: 'VENDA_SYNC',
          reason: 'Fluxo da loja atualizado a partir da venda.',
          payload: { vendaId: venda.id },
        });
      }

      if (shouldStartFactoryFlowFromStoreStatus(snapshotLoja)) {
        await this.garantirFluxoFabricaIniciado(tx, {
          clienteId: venda.cliente_id ?? null,
          vendaId: venda.id,
          orcamentoId: venda.orcamento?.id ?? null,
          triggeredByFlowId: fluxoLoja.id,
          reason: 'Venda alcançou o gatilho de início do fluxo da fábrica.',
        });
      }

      for (const agenda of venda.agendamentos_loja || []) {
        await this.syncAgendaFlow(tx, {
          context: 'STORE',
          scheduleType: 'AGENDA_LOJA',
          scheduleId: agenda.id,
          schedule: agenda,
          source: 'AGENDA_LOJA_SYNC',
          reason: 'Sincronização da agenda da loja para o fluxo gêmeo.',
        });
      }

      for (const agenda of venda.agendamentos_fabrica || []) {
        await this.syncAgendaFlow(tx, {
          context: 'FACTORY',
          scheduleType: 'AGENDA_FABRICA',
          scheduleId: agenda.id,
          schedule: agenda,
          source: 'AGENDA_FABRICA_SYNC',
          reason: 'Sincronização da agenda da fábrica para o fluxo gêmeo.',
        });
      }
    });

    return this.getTwinFlowProgressByVendaId(vendaId);
  }

  async getTwinFlowProgressByVendaId(vendaId: number) {
    const rows = await this.fluxoTable().findMany({
      where: { venda_id: vendaId },
      include: {
        agendamentos: {
          orderBy: { atualizado_em: 'desc' },
        },
        historico: {
          orderBy: { criado_em: 'desc' },
          take: 20,
        },
      },
      orderBy: [
        { contexto: 'asc' },
        { ordem_etapa: 'asc' },
        { atualizado_em: 'desc' },
      ],
    });

    return rows.map((row: any) => ({
      id: row.id,
      context: row.contexto,
      entityStatus: {
        flowContext: row.contexto,
        status: row.status,
        subStep: row.subetapa,
        macroStage: row.macroetapa,
        executionStatus: row.execucao_etapa,
        stepLabel: row.label_etapa,
        order: row.ordem_etapa,
        terminal: Boolean(row.terminal),
      },
      venda_id: row.venda_id,
      cliente_id: row.cliente_id,
      orcamento_id: row.orcamento_id,
      triggered_by_flow_id: row.disparado_por_fluxo_id,
      updated_at: row.atualizado_em,
      schedules: (row.agendamentos || []).map((agenda: any) => ({
        id: agenda.id,
        type: agenda.agenda_tipo,
        title: agenda.titulo,
        status: agenda.status,
        subStep: agenda.subetapa,
        executionStatus: agenda.execucao_etapa,
        startAt: agenda.inicio_em,
        endAt: agenda.fim_em,
      })),
      history: (row.historico || []).map((item: any) => ({
        id: item.id,
        from: {
          status: item.status_anterior,
          subStep: item.subetapa_anterior,
          executionStatus: item.execucao_anterior,
        },
        to: {
          status: item.status,
          subStep: item.subetapa,
          macroStage: item.macroetapa,
          executionStatus: item.execucao_etapa,
          stepLabel: item.label_etapa,
          order: item.ordem_etapa,
        },
        source: item.origem_evento,
        reason: item.motivo,
        scheduleType: item.agenda_tipo,
        scheduleId: item.agenda_id,
        createdAt: item.criado_em,
      })),
    }));
  }

  async listOperationalFlows(user?: TwinFlowViewer | null) {
    const allowedContexts = this.resolveAllowedContexts(user);
    if (!allowedContexts.length) return [];

    const rows = await this.fluxoTable().findMany({
      where: {
        contexto: { in: allowedContexts },
        cancelado_em: null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome_completo: true,
            razao_social: true,
            nome_fantasia: true,
            telefone: true,
            whatsapp: true,
            cidade: true,
            estado: true,
          },
        },
        venda: {
          select: {
            id: true,
            status: true,
            data_venda: true,
            representante_venda_funcionario_id: true,
          },
        },
        agendamentos: {
          orderBy: { atualizado_em: 'desc' },
          take: 3,
        },
        historico: {
          orderBy: { criado_em: 'desc' },
          take: 3,
        },
      },
      orderBy: [
        { contexto: 'asc' },
        { atualizado_em: 'desc' },
      ],
    });

    return rows.map((row: any) => ({
      id: row.id,
      context: row.contexto,
      entityStatus: {
        flowContext: row.contexto,
        status: row.status,
        subStep: row.subetapa,
        macroStage: row.macroetapa,
        executionStatus: row.execucao_etapa,
        stepLabel: row.label_etapa,
        order: row.ordem_etapa,
        terminal: Boolean(row.terminal),
      },
      venda_id: row.venda_id,
      cliente_id: row.cliente_id,
      orcamento_id: row.orcamento_id,
      triggered_by_flow_id: row.disparado_por_fluxo_id,
      started_at: row.iniciado_em,
      completed_at: row.concluido_em,
      updated_at: row.atualizado_em,
      cliente: row.cliente
        ? {
            id: row.cliente.id,
            nome_completo: row.cliente.nome_completo,
            razao_social: row.cliente.razao_social,
            nome_fantasia: row.cliente.nome_fantasia,
            telefone: row.cliente.telefone,
            whatsapp: row.cliente.whatsapp,
            cidade: row.cliente.cidade,
            estado: row.cliente.estado,
          }
        : null,
      venda: row.venda
        ? {
            id: row.venda.id,
            status: row.venda.status,
            data_venda: row.venda.data_venda,
            representante_venda_funcionario_id: row.venda.representante_venda_funcionario_id,
          }
        : null,
      schedules: (row.agendamentos || []).map((agenda: any) => ({
        id: agenda.agenda_id,
        type: agenda.agenda_tipo,
        title: agenda.titulo,
        status: agenda.status,
        subStep: agenda.subetapa,
        executionStatus: agenda.execucao_etapa,
        startAt: agenda.inicio_em,
        endAt: agenda.fim_em,
        updatedAt: agenda.atualizado_em,
      })),
      history: (row.historico || []).map((item: any) => ({
        id: item.id,
        from: {
          status: item.status_anterior,
          subStep: item.subetapa_anterior,
          executionStatus: item.execucao_anterior,
        },
        to: {
          status: item.status,
          subStep: item.subetapa,
          macroStage: item.macroetapa,
          executionStatus: item.execucao_etapa,
          stepLabel: item.label_etapa,
          order: item.ordem_etapa,
        },
        source: item.origem_evento,
        reason: item.motivo,
        scheduleType: item.agenda_tipo,
        scheduleId: item.agenda_id,
        createdAt: item.criado_em,
      })),
    }));
  }
}