import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrcamentoTecnicoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista orçamentos técnicos (opcional: filtrar por agenda_loja_id).
   */
  async listar(agendaLojaId?: number) {
    const where = agendaLojaId != null ? { agenda_loja_id: agendaLojaId } : {};
    return this.prisma.orcamento_tecnico.findMany({
      where,
      include: {
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            cliente_id: true,
            cliente: { select: { id: true, nome_completo: true } },
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  /**
   * Busca um orçamento técnico por id com itens.
   */
  async buscarPorId(id: number) {
    const ot = await this.prisma.orcamento_tecnico.findUnique({
      where: { id },
      include: {
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            cliente_id: true,
            cliente: { select: { id: true, nome_completo: true } },
          },
        },
        itens: { orderBy: { id: 'asc' } },
      },
    });
    if (!ot) throw new BadRequestException('Orçamento técnico não encontrado.');
    return ot;
  }

  /**
   * Cria um orçamento técnico a partir dos ambientes medidos selecionados.
   * Salva em orcamento_tecnico e orcamento_tecnico_itens (tabelas independentes do orçamento antigo).
   */
  async criarDeMedicao(agendaLojaId: number, ambienteIds: number[]) {
    const agenda = await this.prisma.agenda_loja.findUnique({
      where: { id: agendaLojaId },
      select: { id: true },
    });
    if (!agenda) throw new BadRequestException('Agendamento não encontrado.');
    if (!Array.isArray(ambienteIds) || ambienteIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um ambiente para converter em orçamento técnico.');
    }

    const medicao = await this.prisma.medicao_orcamento.findUnique({
      where: { agenda_loja_id: agendaLojaId },
      include: {
        ambientes: {
          where: { id: { in: ambienteIds } },
          orderBy: { nome_ambiente: 'asc' },
          include: { paredes: { orderBy: { nome: 'asc' } } },
        },
      },
    });
    if (!medicao) throw new BadRequestException('Medição para orçamento não encontrada para este agendamento.');
    const ambientes = medicao.ambientes ?? [];
    if (ambientes.length === 0) throw new BadRequestException('Selecione ao menos um ambiente para converter em orçamento técnico.');

    const zero = new Decimal(0);
    const itensCreate: Array<{
      nome_ambiente: string;
      descricao: string;
      valor_unitario: Decimal;
      valor_total: Decimal;
      observacao: string;
    }> = [];

    for (const amb of ambientes) {
      const nomeAmbiente = amb.nome_ambiente ?? 'Ambiente';
      const paredes = amb.paredes ?? [];
      if (paredes.length === 0) {
        itensCreate.push({
          nome_ambiente: nomeAmbiente,
          descricao: nomeAmbiente,
          valor_unitario: zero,
          valor_total: zero,
          observacao: (amb.observacoes ?? '').slice(0, 2000),
        });
      } else {
        for (const p of paredes) {
          const partes: string[] = [p.nome ?? 'Parede'];
          if (p.largura_m != null || p.pe_direito_m != null || p.profundidade_m != null) {
            const vals = [
              p.largura_m != null ? `${Number(p.largura_m) * 1000}mm` : null,
              p.pe_direito_m != null ? `${Number(p.pe_direito_m) * 1000}mm` : null,
              p.profundidade_m != null ? `${Number(p.profundidade_m) * 1000}mm` : null,
            ].filter(Boolean);
            if (vals.length) partes.push(vals.join(' × '));
          }
          itensCreate.push({
            nome_ambiente: nomeAmbiente,
            descricao: partes.join(' — ').slice(0, 500),
            valor_unitario: zero,
            valor_total: zero,
            observacao: ((p.observacoes ?? '').trim() || '').slice(0, 2000),
          });
        }
      }
    }

    const orcamentoTecnico = await this.prisma.orcamento_tecnico.create({
      data: {
        agenda_loja_id: agendaLojaId,
        itens: {
          create: itensCreate,
        },
      },
      include: { itens: true },
    });
    return orcamentoTecnico;
  }
}
