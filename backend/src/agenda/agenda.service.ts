import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgendaDto) {
    const { equipe_ids, ...dadosAgenda } = dto;

    // ✅ Transação Real: Garante a integridade dos dados
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o evento na agenda com a equipe vinculada
      const agendamento = await tx.agenda_global.create({
        data: {
          ...dadosAgenda,
          equipe: {
            create: equipe_ids.map((id) => ({
              funcionario_id: id,
            })),
          },
        },
        include: {
          equipe: { include: { funcionario: true } },
          cliente: true,
        },
      });

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
        switch (dto.categoria) {
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

      // Retorna o agendamento criado para finalizar a transação
      return agendamento;
    }); // <--- Chave e parênteses da transação fechados aqui
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
