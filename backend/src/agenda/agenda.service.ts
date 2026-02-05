import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgendaDto) {
    const { equipe_ids, ...dadosAgenda } = dto;

    // ✅ Transação Real: Ou faz tudo, ou não faz nada.
    return this.prisma.$transaction(async (tx) => {
      
      // 1. Cria o evento na agenda com a equipe
      const agendamento = await tx.agenda_global.create({
        data: {
          ...dadosAgenda,
          equipe: {
            create: equipe_ids.map((id) => ({
              funcionario_id: id, // Simplificando a conexão
            })),
          },
        },
        include: {
          equipe: { include: { funcionario: true } },
          cliente: true,
        },
      });

// No create do AgendaService
if (dto.plano_corte_id) {
  await tx.plano_corte.update({
    where: { id: dto.plano_corte_id },
    data: { status: 'EM_PRODUCAO' } // Key da ordem 2 do seu pipeline-plano-corte
  });
}

if (dto.venda_id) {
  // Exemplo: Se for agendamento de fabricação
  await tx.vendas.update({
    where: { id: dto.venda_id },
    data: { status: 'EM_PRODUCAO' } // Key da ordem 19 do seu pipeline-cliente
  });
}

      return agendamento;
    });
  }

  async findAll(inicio?: string, fim?: string) {
    return this.prisma.agenda_global.findMany({
      where: {
        inicio_em: {
          gte: inicio ? new Date(inicio) : undefined,
          lte: fim ? new Date(fim) : undefined,
        },
      },
      include: {
        cliente: true,
        equipe: { include: { funcionario: true } },
        plano_corte: true, // Adicionado para você saber o que está sendo cortado
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
        plano_corte: true,
      },
      orderBy: { inicio_em: 'asc' },
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

  async remove(id: number) {
    return this.prisma.agenda_global.delete({
      where: { id },
    });
  }
}