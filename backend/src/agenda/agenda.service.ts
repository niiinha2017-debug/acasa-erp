import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import {
  normalizarOrigemFluxo,
  normalizarSetorDestino,
  origemPermitidaNoSetor,
  OrigemFluxo,
  SetorDestino,
} from './agenda-rules';
import { validarTransicaoStatusCliente } from '../shared/constantes/pipeline-cliente';

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);
  constructor(private prisma: PrismaService) {}

  private categoriaToStatus(categoria?: string) {
    const categoriaKey = String(categoria || '').toUpperCase();
    const map: Record<string, string> = {
      MEDIDA: 'MEDIDA_AGENDADA',
      ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      PRODUCAO: 'PRODUCAO_AGENDADA',
      MONTAGEM: 'MONTAGEM_AGENDADA',
      GARANTIA: 'GARANTIA',
      MANUTENCAO: 'MANUTENCAO',
      ASSISTENCIA: 'ASSISTENCIA',
    };
    return { categoriaKey, status: map[categoriaKey] || '' };
  }

  private registrarAuditoriaStatusPosVenda(params: {
    agendaId: number;
    vendaId?: number | null;
    clienteId?: number | null;
    statusAplicado: string;
    origemAplicada: 'venda' | 'cliente';
  }) {
    this.logger.log(
      `[POS_VENDA] agenda=${params.agendaId} venda=${params.vendaId || 'null'} cliente=${params.clienteId || 'null'} status=${params.statusAplicado} origem=${params.origemAplicada}`,
    );
  }

  private async atualizarStatusVendaComValidacao(
    tx: any,
    vendaId: number,
    proximoStatus: string,
    contexto: string,
  ) {
    const venda = await tx.vendas.findUnique({
      where: { id: vendaId },
      select: { id: true, status: true },
    });
    if (!venda) {
      throw new BadRequestException('Venda vinculada ao agendamento não encontrada.');
    }

    const validacao = validarTransicaoStatusCliente({
      atual: venda.status,
      proximo: proximoStatus,
    });

    if (!validacao.ok) {
      throw new BadRequestException(`${contexto}: ${validacao.motivo}`);
    }

    await tx.vendas.update({
      where: { id: vendaId },
      data: { status: proximoStatus },
    });
  }

  private async persistirAuditoriaStatusPosVenda(
    tx: any,
    params: {
      agendaId: number;
      origemAplicada: 'venda' | 'cliente';
    },
  ) {
    await tx.agenda_global.update({
      where: { id: params.agendaId },
      data: {
        status_source: params.origemAplicada,
        status_aplicado_em: new Date(),
      },
    });
  }

  private inferirOrigemFluxo(
    planoCorteId?: number | null,
    vendaId?: number | null,
  ): OrigemFluxo {
    if (planoCorteId) return vendaId ? 'VENDA_PLANO_CORTE' : 'PLANO_CORTE';
    if (vendaId) return 'LOJA_VENDA';
    return 'TAREFA';
  }

  private resolverSetorOrigem(params: {
    setorDestinoInput?: string | null;
    origemFluxoInput?: string | null;
    setorAtual?: string | null;
    origemAtual?: string | null;
    planoCorteId?: number | null;
    vendaId?: number | null;
  }): { setorDestino: SetorDestino; origemFluxo: OrigemFluxo } {
    const origemAtual = normalizarOrigemFluxo(params.origemAtual);
    const setorAtual = normalizarSetorDestino(params.setorAtual);
    const origemFluxo =
      normalizarOrigemFluxo(params.origemFluxoInput) ||
      origemAtual ||
      this.inferirOrigemFluxo(params.planoCorteId, params.vendaId);

    const setorInferidoPorOrigem: SetorDestino =
      origemFluxo === 'PLANO_CORTE' || origemFluxo === 'VENDA_PLANO_CORTE'
        ? 'PRODUCAO'
        : 'LOJA';

    const setorDestino =
      normalizarSetorDestino(params.setorDestinoInput) ||
      setorAtual ||
      (params.planoCorteId ? 'PRODUCAO' : setorInferidoPorOrigem);

    if (!origemPermitidaNoSetor(setorDestino, origemFluxo)) {
      throw new BadRequestException(
        `Combinação inválida: setor ${setorDestino} não permite origem ${origemFluxo}.`,
      );
    }

    return { setorDestino, origemFluxo };
  }

  private validarVinculosPorOrigem(params: {
    origemFluxo: OrigemFluxo;
    vendaId?: number | null;
    planoCorteId?: number | null;
    clienteId?: number | null;
    fornecedorId?: number | null;
  }) {
    const { origemFluxo, vendaId, planoCorteId, clienteId, fornecedorId } = params;
    if (origemFluxo === 'PLANO_CORTE' && !planoCorteId) {
      throw new BadRequestException('Origem PLANO_CORTE exige plano_corte_id.');
    }
    if (origemFluxo === 'VENDA_PLANO_CORTE' && (!planoCorteId || !vendaId)) {
      throw new BadRequestException(
        'Origem VENDA_PLANO_CORTE exige venda_id e plano_corte_id.',
      );
    }
    if (origemFluxo === 'LOJA_VENDA' && !vendaId) {
      throw new BadRequestException('Origem LOJA_VENDA exige venda_id.');
    }
    if (origemFluxo === 'POS_VENDA' && !vendaId && !clienteId) {
      throw new BadRequestException('Origem POS_VENDA exige venda_id ou cliente_id.');
    }
    if (origemFluxo !== 'TAREFA' && !clienteId && !fornecedorId && !planoCorteId) {
      throw new BadRequestException(
        'Agendamento vinculado exige cliente_id ou plano_corte_id.',
      );
    }
  }

  private validarPeriodo(inicio: Date, fim: Date) {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Período inválido para o agendamento');
    }
    if (fim <= inicio) {
      throw new BadRequestException('Data de término deve ser maior que a de início');
    }
  }

  private async validarConflitosHorario(
    tx: any,
    params: {
      agendaIdIgnorar?: number;
      inicio: Date;
      fim: Date;
      equipeIds: number[];
      apontamentos?: Array<{
        funcionario_id: number;
        inicio_em: Date | string;
        fim_em: Date | string;
      }>;
    },
  ) {
    const equipeIdsUnicos = Array.from(
      new Set((params.equipeIds || []).map(Number).filter(Boolean)),
    );
    if (!equipeIdsUnicos.length) return;

    const hasApontamentos = Array.isArray(params.apontamentos) && params.apontamentos.length > 0;
    const periodosPorFuncionario = new Map<number, Array<{ inicio: Date; fim: Date }>>();

    if (hasApontamentos) {
      for (const item of params.apontamentos || []) {
        const fid = Number(item.funcionario_id);
        if (!fid) continue;
        const inicio = new Date(item.inicio_em);
        const fim = new Date(item.fim_em);
        this.validarPeriodo(inicio, fim);
        const atual = periodosPorFuncionario.get(fid) || [];
        atual.push({ inicio, fim });
        periodosPorFuncionario.set(fid, atual);
      }
    } else {
      for (const fid of equipeIdsUnicos) {
        periodosPorFuncionario.set(fid, [{ inicio: params.inicio, fim: params.fim }]);
      }
    }

    for (const [funcionarioId, periodos] of periodosPorFuncionario.entries()) {
      const orPeriodos = periodos.map((p) => ({
        inicio_em: { lt: p.fim },
        fim_em: { gt: p.inicio },
      }));

      // Conflito em apontamentos já existentes desse funcionário
      const conflitoApontamento = await tx.agenda_apontamentos.findFirst({
        where: {
          funcionario_id: funcionarioId,
          agenda_id: params.agendaIdIgnorar ? { not: params.agendaIdIgnorar } : undefined,
          agenda: { status: { not: 'CANCELADO' } },
          OR: orPeriodos,
        },
        select: { id: true, agenda_id: true },
      });

      if (conflitoApontamento) {
        throw new BadRequestException(
          `Conflito de horário para o funcionário ${funcionarioId}.`,
        );
      }

      // Conflito em eventos sem apontamento detalhado (usa janela do evento)
      const conflitoEvento = await tx.agenda_global.findFirst({
        where: {
          id: params.agendaIdIgnorar ? { not: params.agendaIdIgnorar } : undefined,
          status: { not: 'CANCELADO' },
          equipe: { some: { funcionario_id: funcionarioId } },
          OR: orPeriodos,
        },
        select: { id: true },
      });

      if (conflitoEvento) {
        throw new BadRequestException(
          `Conflito de horário para o funcionário ${funcionarioId}.`,
        );
      }
    }
  }

  async create(dto: CreateAgendaDto) {
    const {
      equipe_ids,
      categoria,
      apontamentos,
      origem_fluxo,
      setor_destino,
      ...dadosAgenda
    } = dto;
    const { status: clienteStatus } = this.categoriaToStatus(categoria);

    // Regra: cliente_id OU (plano_corte_id com fornecedor)
    const clienteId = dto.cliente_id ?? null;
    let fornecedorId = dto.fornecedor_id ?? null;

    if (dto.plano_corte_id) {
      const plano = await this.prisma.plano_corte.findUnique({
        where: { id: dto.plano_corte_id },
        select: { fornecedor_id: true },
      });
      if (!plano)
        throw new BadRequestException('Plano de Corte não encontrado');
      fornecedorId = plano.fornecedor_id;
    }
    this.validarPeriodo(new Date(dto.inicio_em), new Date(dto.fim_em));

    const { setorDestino, origemFluxo } = this.resolverSetorOrigem({
      setorDestinoInput: setor_destino,
      origemFluxoInput: origem_fluxo,
      planoCorteId: dto.plano_corte_id,
      vendaId: dto.venda_id,
    });

    this.validarVinculosPorOrigem({
      origemFluxo,
      vendaId: dto.venda_id,
      planoCorteId: dto.plano_corte_id,
      clienteId,
      fornecedorId,
    });

    const dataAgenda = {
      ...dadosAgenda,
      cliente_id: clienteId,
      fornecedor_id: fornecedorId,
      categoria: categoria || null,
      origem_fluxo: origemFluxo,
      setor_destino: setorDestino,
    };

    const idsEquipe = Array.isArray(equipe_ids)
      ? Array.from(new Set(equipe_ids.map(Number).filter(Boolean)))
      : [];

    return this.prisma.$transaction(async (tx) => {
      await this.validarConflitosHorario(tx, {
        inicio: new Date(dto.inicio_em),
        fim: new Date(dto.fim_em),
        equipeIds: idsEquipe,
        apontamentos,
      });

      // 1. Cria o evento na agenda (equipe opcional)
      const agendamento = await tx.agenda_global.create({
        data: {
          ...dataAgenda,
          equipe: {
            create: idsEquipe.map((id) => ({
              funcionario_id: id,
            })),
          },
        },
        include: {
          equipe: { include: { funcionario: true } },
          apontamentos: true,
          cliente: true,
          fornecedor: true,
          plano_corte: true,
          venda: true,
        } as any,
      });

      // 1.1. Cria apontamentos de horas, se enviados
      if (Array.isArray(apontamentos) && apontamentos.length) {
        await (tx as any).agenda_apontamentos.createMany({
          data: apontamentos.map((item) => ({
            agenda_id: agendamento.id,
            funcionario_id: item.funcionario_id,
            inicio_em: new Date(item.inicio_em),
            fim_em: new Date(item.fim_em),
          })),
        });
      }

      // 2. Atualiza status do Plano de Corte se houver ID
      if (dto.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: dto.plano_corte_id },
          data: { status: 'EM_PRODUCAO' }, // Key da ordem 2 do pipeline
        });
      }

      const novoStatus = clienteStatus;
      if (origemFluxo === 'POS_VENDA' && novoStatus) {
        const origemAplicada: 'venda' | 'cliente' =
          dto.venda_id && dto.venda_id > 0 ? 'venda' : 'cliente';

        if (origemAplicada === 'venda' && dto.venda_id) {
          await this.atualizarStatusVendaComValidacao(
            tx,
            dto.venda_id,
            novoStatus,
            'Agendamento (pós-venda)',
          );
        } else if (clienteId) {
          await tx.cliente.update({
            where: { id: clienteId },
            data: { status: novoStatus },
          });
        }

        this.registrarAuditoriaStatusPosVenda({
          agendaId: agendamento.id,
          vendaId: dto.venda_id,
          clienteId,
          statusAplicado: novoStatus,
          origemAplicada,
        });
        await this.persistirAuditoriaStatusPosVenda(tx, {
          agendaId: agendamento.id,
          origemAplicada,
        });
      } else {
        if (dto.venda_id && novoStatus) {
          await this.atualizarStatusVendaComValidacao(
            tx,
            dto.venda_id,
            novoStatus,
            'Agendamento',
          );
        }

        if (clienteId && clienteStatus) {
          await tx.cliente.update({
            where: { id: clienteId },
            data: { status: clienteStatus },
          });
        }
      }

      // Retorna o agendamento criado para finalizar a transação
      return agendamento;
    }); // <--- Chave e parênteses da transação fechados aqui
  }
  async findAll(
    inicio?: string,
    fim?: string,
    opts?: {
      includePlanoCorte?: boolean;
      status?: string;
      funcionarioId?: number;
      setorDestino?: 'LOJA' | 'PRODUCAO';
      origemFluxo?: OrigemFluxo;
      incluirCancelados?: boolean;
    },
  ) {
    const includePlanoCorte = opts?.includePlanoCorte !== false;
    const incluirCancelados = opts?.incluirCancelados === true;
    return this.prisma.agenda_global.findMany({
      where: {
        inicio_em: {
          gte: inicio ? new Date(inicio) : undefined,
          lte: fim ? new Date(fim) : undefined,
        },
        status: opts?.status
          ? opts.status
          : incluirCancelados
            ? undefined
            : { not: 'CANCELADO' },
        equipe: opts?.funcionarioId
          ? {
              some: {
                funcionario_id: opts.funcionarioId,
              },
            }
          : undefined,
        setor_destino: opts?.setorDestino || undefined,
        origem_fluxo: opts?.origemFluxo || undefined,
        ...(includePlanoCorte ? {} : { plano_corte_id: null }),
      },
      include: {
        cliente: true,
        fornecedor: true,
        equipe: { include: { funcionario: true } },
        plano_corte: true,
        venda: true,
        apontamentos: true,
      } as any,
      orderBy: { inicio_em: 'asc' },
    });
  }

  async findByFuncionario(funcionarioId: number) {
    return this.prisma.agenda_global.findMany({
      where: {
        status: { not: 'CANCELADO' },
        equipe: {
          some: { funcionario_id: funcionarioId },
        },
      },
      include: {
        cliente: true,
        fornecedor: true,
        plano_corte: true,
        apontamentos: true,
      } as any,
      orderBy: { inicio_em: 'asc' },
    });
  }

  async update(id: number, dto: UpdateAgendaDto) {
    const atual = await this.prisma.agenda_global.findUnique({
      where: { id },
      include: {
        equipe: true,
        apontamentos: true,
      } as any,
    });
    if (!atual) {
      throw new BadRequestException('Agendamento não encontrado');
    }

    const {
      equipe_ids,
      categoria,
      apontamentos,
      origem_fluxo,
      setor_destino,
      ...dadosAgenda
    } = dto;
    const categoriaRef = categoria ?? (atual as any).categoria;
    const { status: clienteStatus } = this.categoriaToStatus(categoriaRef);

    const inicio = dto.inicio_em ? new Date(dto.inicio_em) : new Date(atual.inicio_em);
    const fim = dto.fim_em ? new Date(dto.fim_em) : new Date(atual.fim_em);
    this.validarPeriodo(inicio, fim);

    const clienteId = dto.cliente_id ?? atual.cliente_id ?? null;
    let fornecedorId = dto.fornecedor_id ?? atual.fornecedor_id ?? null;
    const planoCorteId = dto.plano_corte_id ?? atual.plano_corte_id ?? null;

    if (planoCorteId) {
      const plano = await this.prisma.plano_corte.findUnique({
        where: { id: planoCorteId },
        select: { fornecedor_id: true },
      });
      if (!plano) {
        throw new BadRequestException('Plano de Corte não encontrado');
      }
      fornecedorId = plano.fornecedor_id;
    }

    const vendaId = dto.venda_id ?? atual.venda_id ?? null;
    const { setorDestino, origemFluxo } = this.resolverSetorOrigem({
      setorDestinoInput: setor_destino,
      origemFluxoInput: origem_fluxo,
      setorAtual: (atual as any).setor_destino,
      origemAtual: (atual as any).origem_fluxo,
      planoCorteId,
      vendaId,
    });

    if (
      (atual as any).origem_fluxo &&
      String((atual as any).origem_fluxo).toUpperCase() !== 'TAREFA' &&
      origemFluxo === 'TAREFA'
    ) {
      throw new BadRequestException(
        'Edição inválida: não é permitido remover o vínculo de origem deste agendamento.',
      );
    }

    if (
      setor_destino &&
      (atual as any).setor_destino &&
      String((atual as any).setor_destino).toUpperCase() !== setorDestino
    ) {
      throw new BadRequestException(
        'Use o endpoint enviar-producao para alterar o setor destino.',
      );
    }

    this.validarVinculosPorOrigem({
      origemFluxo,
      vendaId,
      planoCorteId,
      clienteId,
      fornecedorId,
    });

    const equipeIds = Array.isArray(equipe_ids)
      ? Array.from(new Set(equipe_ids.map(Number).filter(Boolean)))
      : atual.equipe.map((e) => e.funcionario_id);

    const apontamentosParaConflito =
      Array.isArray(apontamentos) && apontamentos.length
        ? apontamentos
        : atual.apontamentos.map((a) => ({
            funcionario_id: a.funcionario_id,
            inicio_em: a.inicio_em,
            fim_em: a.fim_em,
          }));

    return this.prisma.$transaction(async (tx) => {
      await this.validarConflitosHorario(tx, {
        agendaIdIgnorar: id,
        inicio,
        fim,
        equipeIds,
        apontamentos: apontamentosParaConflito,
      });

      const agendamento = await tx.agenda_global.update({
        where: { id },
        data: {
          ...dadosAgenda,
          cliente_id: clienteId,
          fornecedor_id: fornecedorId,
          categoria: categoria ?? (atual as any).categoria ?? null,
          origem_fluxo: origemFluxo,
          setor_destino: setorDestino,
          inicio_em: inicio,
          fim_em: fim,
        },
      });

      if (Array.isArray(equipe_ids)) {
        await tx.agenda_funcionarios.deleteMany({ where: { agenda_id: id } });
        if (equipeIds.length) {
          await tx.agenda_funcionarios.createMany({
            data: equipeIds.map((funcionarioId) => ({
              agenda_id: id,
              funcionario_id: funcionarioId,
            })),
          });
        }
      }

      if (Array.isArray(apontamentos)) {
        await tx.agenda_apontamentos.deleteMany({ where: { agenda_id: id } });
        if (apontamentos.length) {
          await tx.agenda_apontamentos.createMany({
            data: apontamentos.map((item) => ({
              agenda_id: id,
              funcionario_id: item.funcionario_id,
              inicio_em: new Date(item.inicio_em),
              fim_em: new Date(item.fim_em),
            })),
          });
        }
      }

      const novoStatus = clienteStatus;
      if (origemFluxo === 'POS_VENDA' && novoStatus) {
        const origemAplicada: 'venda' | 'cliente' =
          vendaId && vendaId > 0 ? 'venda' : 'cliente';

        if (origemAplicada === 'venda' && vendaId) {
          await this.atualizarStatusVendaComValidacao(
            tx,
            vendaId,
            novoStatus,
            'Edição de agendamento (pós-venda)',
          );
        } else if (clienteId) {
          await tx.cliente.update({
            where: { id: clienteId },
            data: { status: novoStatus },
          });
        }

        this.registrarAuditoriaStatusPosVenda({
          agendaId: id,
          vendaId,
          clienteId,
          statusAplicado: novoStatus,
          origemAplicada,
        });
        await this.persistirAuditoriaStatusPosVenda(tx, {
          agendaId: id,
          origemAplicada,
        });
      } else {
        if (vendaId && novoStatus) {
          await this.atualizarStatusVendaComValidacao(
            tx,
            vendaId,
            novoStatus,
            'Edição de agendamento',
          );
        }

        if (clienteId && clienteStatus) {
          await tx.cliente.update({
            where: { id: clienteId },
            data: { status: clienteStatus },
          });
        }

        if ((atual as any).status_source || (atual as any).status_aplicado_em) {
          await tx.agenda_global.update({
            where: { id },
            data: {
              status_source: null,
              status_aplicado_em: null,
            } as any,
          });
        }
      }

      if (planoCorteId) {
        await tx.plano_corte.update({
          where: { id: planoCorteId },
          data: { status: 'EM_PRODUCAO' },
        });
      }

      return agendamento;
    });
  }

  async updateStatus(id: number, status: string) {
    return this.prisma.$transaction(async (tx) => {
      const agendamento = await tx.agenda_global.update({
        where: { id },
        data: { status },
      });

      // Se o funcionário marcou como CONCLUÍDO na agenda,
      // o status do Plano de Corte sobe para FINALIZADO automaticamente.
      if (status === 'CONCLUIDO' && agendamento.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: agendamento.plano_corte_id },
          data: { status: 'FINALIZADO' },
        });
      }

      return agendamento;
    });
  }

  async cancel(id: number) {
    return this.prisma.agenda_global.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  async enviarParaProducao(id: number) {
    const atual = await this.prisma.agenda_global.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        setor_destino: true,
        origem_fluxo: true,
        venda_id: true,
        plano_corte_id: true,
      },
    });

    if (!atual) {
      throw new BadRequestException('Agendamento não encontrado');
    }
    if (atual.status === 'CANCELADO') {
      throw new BadRequestException('Não é possível enviar agendamento cancelado para produção.');
    }
    if (String(atual.setor_destino || '').toUpperCase() === 'PRODUCAO') {
      throw new BadRequestException('Agendamento já está no setor de produção.');
    }

    const origemProducao = this.inferirOrigemFluxo(atual.plano_corte_id, atual.venda_id);
    const setorOrigemAtual = this.resolverSetorOrigem({
      setorDestinoInput: atual.setor_destino,
      origemFluxoInput: atual.origem_fluxo,
      planoCorteId: atual.plano_corte_id,
      vendaId: atual.venda_id,
    });

    if (setorOrigemAtual.setorDestino !== 'LOJA') {
      throw new BadRequestException('Somente agendamentos da loja podem ser enviados para produção.');
    }
    if (origemProducao === 'LOJA_VENDA' || origemProducao === 'POS_VENDA') {
      throw new BadRequestException(
        'Envio para produção exige plano de corte vinculado ou origem TAREFA.',
      );
    }

    return this.prisma.agenda_global.update({
      where: { id },
      data: {
        setor_destino: 'PRODUCAO',
        origem_fluxo: origemProducao,
      },
    });
  }
}
