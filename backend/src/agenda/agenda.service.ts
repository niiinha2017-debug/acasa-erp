import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';

type AgendaFindOptions = {
  includePlanoCorte?: boolean;
  origemFluxo?: string;
  categoria?: string;
};

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  private normalizeKey(value?: string | null) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  private resolveOrigemFluxo(params: {
    origemFluxoInformada?: string;
    clienteId?: number | null;
    fornecedorId?: number | null;
    planoCorteId?: number | null;
  }) {
    const origemInformada = this.normalizeKey(params.origemFluxoInformada);
    if (origemInformada === 'CLIENTE' || origemInformada === 'FORNECEDOR') {
      return origemInformada;
    }
    if (params.planoCorteId || params.fornecedorId) {
      return 'FORNECEDOR';
    }
    if (params.clienteId) {
      return 'CLIENTE';
    }
    return null;
  }

  async create(dto: CreateAgendaDto) {
    const { equipe_ids, categoria, origem_fluxo, ...dadosAgenda } = dto;
    const categoriaKey = this.normalizeKey(categoria) || null;

    const categoriaToClienteStatus: Record<string, string> = {
      MEDIDA: 'MEDIDA_AGENDADA',
      ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      PRODUCAO: 'PRODUCAO_AGENDADA',
      MONTAGEM: 'MONTAGEM_AGENDADA',
    };

    const categoriaToVendaStatus: Record<string, string> = {
      MEDIDA: 'MEDIDA_AGENDADA',
      MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      PRODUCAO: 'PRODUCAO_AGENDADA',
      MONTAGEM: 'MONTAGEM_AGENDADA',
    };

    let clienteId = dto.cliente_id ?? null;
    let fornecedorId = dto.fornecedor_id ?? null;

    if (dto.plano_corte_id) {
      const plano = await this.prisma.plano_corte.findUnique({
        where: { id: dto.plano_corte_id },
        select: { fornecedor_id: true },
      });
      if (!plano) {
        throw new BadRequestException('Plano de Corte nao encontrado');
      }
      fornecedorId = plano.fornecedor_id;
    }

    if (!clienteId && !fornecedorId) {
      throw new BadRequestException('Informe cliente_id ou plano_corte_id');
    }

    const origemFluxo = this.resolveOrigemFluxo({
      origemFluxoInformada: origem_fluxo,
      clienteId,
      fornecedorId,
      planoCorteId: dto.plano_corte_id,
    });

    const dataAgenda: any = {
      ...dadosAgenda,
      cliente_id: clienteId,
      fornecedor_id: fornecedorId,
      categoria: categoriaKey,
      origem_fluxo: origemFluxo,
    };

    return this.prisma.$transaction(async (tx) => {
      const agendamento: any = await tx.agenda_global.create({
        data: {
          ...dataAgenda,
          equipe: {
            create: equipe_ids.map((id) => ({ funcionario_id: id })),
          },
        } as any,
        include: {
          equipe: { include: { funcionario: true } },
          cliente: true,
          fornecedor: true,
          plano_corte: true,
          venda: true,
        },
      });

      if (dto.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: dto.plano_corte_id },
          data: { status: 'EM_PRODUCAO' },
        });
      }

      if (dto.venda_id && categoriaKey) {
        const vendaStatus = categoriaToVendaStatus[categoriaKey];
        if (vendaStatus) {
          await tx.vendas.update({
            where: { id: dto.venda_id },
            data: { status: vendaStatus },
          });
        }
      }

      const clienteStatus = categoriaKey
        ? categoriaToClienteStatus[categoriaKey]
        : null;
      if (clienteId && clienteStatus) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { status: clienteStatus },
        });
      }

      return agendamento;
    });
  }

  async findAll(inicio?: string, fim?: string, opts?: AgendaFindOptions) {
    const includePlanoCorte = opts?.includePlanoCorte !== false;
    const origemFluxo = this.normalizeKey(opts?.origemFluxo) || undefined;
    const categoria = this.normalizeKey(opts?.categoria) || undefined;

    return this.prisma.agenda_global.findMany({
      where: {
        inicio_em: {
          gte: inicio ? new Date(inicio) : undefined,
          lte: fim ? new Date(fim) : undefined,
        },
        ...(includePlanoCorte ? {} : { plano_corte_id: null }),
        ...(origemFluxo ? ({ origem_fluxo: origemFluxo } as any) : {}),
        ...(categoria ? ({ categoria } as any) : {}),
      } as any,
      include: {
        cliente: true,
        fornecedor: true,
        equipe: { include: { funcionario: true } },
        plano_corte: true,
        venda: true,
      },
      orderBy: { inicio_em: 'asc' },
    });
  }

  async findByFuncionario(funcionarioId: number) {
    return this.prisma.agenda_global.findMany({
      where: {
        equipe: {
          some: { funcionario_id: funcionarioId },
        },
      },
      include: {
        cliente: true,
        fornecedor: true,
        plano_corte: true,
      },
      orderBy: { inicio_em: 'asc' },
    });
  }

  async findByVenda(vendaId: number) {
    return this.prisma.agenda_global.findFirst({
      where: { venda_id: vendaId },
      include: {
        cliente: true,
        equipe: { include: { funcionario: true } },
        venda: true,
      },
    });
  }

  async updateStatus(id: number, status: string) {
    const statusKey = this.normalizeKey(status);

    const categoriaToVendaStatusConcluido: Record<string, string> = {
      MEDIDA: 'MEDIDA_REALIZADA',
      MEDIDA_FINA: 'MEDIDA_FINA_REALIZADA',
      PRODUCAO: 'PRODUCAO_FINALIZADA',
      MONTAGEM: 'MONTAGEM_FINALIZADA',
    };

    const categoriaToVendaStatusAndamento: Record<string, string> = {
      PRODUCAO: 'EM_PRODUCAO',
      MONTAGEM: 'EM_MONTAGEM',
    };

    return this.prisma.$transaction(async (tx) => {
      const agendamento: any = await tx.agenda_global.update({
        where: { id },
        data: { status },
      });

      if (statusKey === 'CONCLUIDO' && agendamento.plano_corte_id) {
        await tx.plano_corte.update({
          where: { id: agendamento.plano_corte_id },
          data: { status: 'FINALIZADO' },
        });
      }

      if (agendamento.venda_id) {
        const categoriaKey = this.normalizeKey(agendamento.categoria);
        let vendaStatus = '';

        if (statusKey === 'CONCLUIDO') {
          vendaStatus = categoriaToVendaStatusConcluido[categoriaKey] || '';
        } else if (statusKey === 'EM_ANDAMENTO') {
          vendaStatus = categoriaToVendaStatusAndamento[categoriaKey] || '';
        }

        if (vendaStatus) {
          await tx.vendas.update({
            where: { id: agendamento.venda_id },
            data: { status: vendaStatus },
          });
        }
      }

      return agendamento;
    });
  }

  async remove(id: number) {
    return this.prisma.agenda_global.delete({ where: { id } });
  }

  async upsertByVendaData(
    vendaId: number,
    payload: {
      inicio_em?: string;
      fim_em?: string;
      titulo?: string;
      categoria?: string;
      status?: string;
    },
  ) {
    const venda = await this.prisma.vendas.findUnique({
      where: { id: vendaId },
      select: { id: true, cliente_id: true, status: true },
    });
    if (!venda) {
      throw new BadRequestException('Venda nao encontrada');
    }

    const inicio = payload?.inicio_em ? new Date(payload.inicio_em) : new Date();
    if (Number.isNaN(inicio.getTime())) {
      throw new BadRequestException('inicio_em invalido');
    }
    const fim = payload?.fim_em
      ? new Date(payload.fim_em)
      : new Date(inicio.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(fim.getTime())) {
      throw new BadRequestException('fim_em invalido');
    }
    if (fim <= inicio) {
      throw new BadRequestException('fim_em deve ser maior que inicio_em');
    }

    const categoria = this.normalizeKey(payload?.categoria) || 'MEDIDA_FINA';
    const status = this.normalizeKey(payload?.status) || 'PENDENTE';
    const titulo =
      String(payload?.titulo || '').trim() ||
      `Venda #${venda.id} - ${String(venda.status || '').toLowerCase().replace(/_/g, ' ')}`;

    return this.prisma.agenda_global.upsert({
      where: { venda_id: venda.id },
      create: {
        venda_id: venda.id,
        cliente_id: venda.cliente_id,
        titulo,
        categoria,
        origem_fluxo: 'CLIENTE',
        inicio_em: inicio,
        fim_em: fim,
        status,
      } as any,
      update: {
        titulo,
        categoria,
        origem_fluxo: 'CLIENTE',
        inicio_em: inicio,
        fim_em: fim,
        status,
      } as any,
    });
  }
}
