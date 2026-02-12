import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgendaDto) {
    const { equipe_ids, categoria, ...dadosAgenda } = dto;
    const categoriaKey = String(categoria || '').toUpperCase();
    const categoriaToStatus: Record<string, string> = {
      MEDIDA: 'MEDIDA_AGENDADA',
      ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
      MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
      PRODUCAO: 'PRODUCAO_AGENDADA',
      MONTAGEM: 'MONTAGEM_AGENDADA',
    };

    // Regra: cliente_id OU (plano_corte_id com fornecedor)
    let clienteId = dto.cliente_id ?? null;
    let fornecedorId = dto.fornecedor_id ?? null;

    if (dto.plano_corte_id) {
      const plano = await this.prisma.plano_corte.findUnique({
        where: { id: dto.plano_corte_id },
        select: { fornecedor_id: true },
      });
      if (!plano) throw new BadRequestException('Plano de Corte não encontrado');
      fornecedorId = plano.fornecedor_id;
    }
    if (!clienteId && !fornecedorId) {
      throw new BadRequestException('Informe cliente_id ou plano_corte_id');
    }

    const { categoria: _cat, ...rest } = dadosAgenda;
    const dataAgenda = {
      ...rest,
      cliente_id: clienteId,
      fornecedor_id: fornecedorId,
    };

    // ✅ Transação Real: Garante a integridade dos dados
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o evento na agenda com a equipe vinculada
      const agendamento = await tx.agenda_global.create({
        data: {
          ...dataAgenda,
          equipe: {
            create: equipe_ids.map((id) => ({
              funcionario_id: id,
            })),
          },
        },
        include: {
          equipe: { include: { funcionario: true } },
          cliente: true,
          fornecedor: true,
          plano_corte: true,
          venda: true,
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

      const clienteStatus = categoriaToStatus[categoriaKey];
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
  async findAll(inicio?: string, fim?: string, opts?: { includePlanoCorte?: boolean }) {
    const includePlanoCorte = opts?.includePlanoCorte !== false
    return this.prisma.agenda_global.findMany({
      where: {
        inicio_em: {
          gte: inicio ? new Date(inicio) : undefined,
          lte: fim ? new Date(fim) : undefined,
        },
        ...(includePlanoCorte ? {} : { plano_corte_id: null }),
      },
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
