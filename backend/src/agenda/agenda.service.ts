import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  private categoriaToStatus(categoria?: string) {
    const categoriaKey = String(categoria || '').toUpperCase();
    const map: Record<string, string> = {
      MEDIDA: 'MEDIDA_AGENDADA',
      ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      PRODUCAO: 'PRODUCAO_AGENDADA',
      MONTAGEM: 'MONTAGEM_AGENDADA',
    };
    return { categoriaKey, status: map[categoriaKey] || '' };
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
    const { equipe_ids, categoria, apontamentos, ...dadosAgenda } = dto;
    const { categoriaKey, status: clienteStatus } = this.categoriaToStatus(categoria);

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
    if (!clienteId && !fornecedorId) {
      throw new BadRequestException('Informe cliente_id ou plano_corte_id');
    }
    this.validarPeriodo(new Date(dto.inicio_em), new Date(dto.fim_em));

    const dataAgenda = {
      ...dadosAgenda,
      cliente_id: clienteId,
      fornecedor_id: fornecedorId,
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

      // 3. Atualiza status da Venda baseado na categoria do agendamento
      // No create do AgendaService.ts
      if (dto.venda_id) {
        let novoStatus = '';

        // Mapeando a categoria da agenda para a KEY do PIPELINE_CLIENTE
        switch (categoriaKey) {
          case 'MEDIDA':
            novoStatus = 'MEDIDA_AGENDADA'; // Ordem 3 do seu pipeline
            break;
          case 'PRODUCAO':
            novoStatus = 'PRODUCAO_AGENDADA'; // Ordem 18 do seu pipeline
            break;
          case 'MONTAGEM':
            novoStatus = 'MONTAGEM_AGENDADA'; // Ordem 22 do seu pipeline
            break;
          case 'MEDIDA_FINA':
            novoStatus = 'MEDIDA_FINA_AGENDADA'; // Ordem 13 do seu pipeline
            break;
        }

        if (novoStatus) {
          await tx.vendas.update({
            where: { id: dto.venda_id },
            data: { status: novoStatus },
          });
        }
      }

      if (clienteId && clienteStatus) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { status: clienteStatus },
        });
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

    const { equipe_ids, categoria, apontamentos, ...dadosAgenda } = dto;
    const { categoriaKey, status: clienteStatus } = this.categoriaToStatus(categoria);

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

    if (!clienteId && !fornecedorId) {
      throw new BadRequestException('Informe cliente_id ou plano_corte_id');
    }

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

      const vendaId = dto.venda_id ?? atual.venda_id ?? null;
      if (vendaId) {
        let novoStatus = '';
        switch (categoriaKey) {
          case 'MEDIDA':
            novoStatus = 'MEDIDA_AGENDADA';
            break;
          case 'PRODUCAO':
            novoStatus = 'PRODUCAO_AGENDADA';
            break;
          case 'MONTAGEM':
            novoStatus = 'MONTAGEM_AGENDADA';
            break;
          case 'MEDIDA_FINA':
            novoStatus = 'MEDIDA_FINA_AGENDADA';
            break;
        }
        if (novoStatus) {
          await tx.vendas.update({
            where: { id: vendaId },
            data: { status: novoStatus },
          });
        }
      }

      if (clienteId && clienteStatus) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { status: clienteStatus },
        });
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
}
