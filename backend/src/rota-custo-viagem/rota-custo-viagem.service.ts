import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateRotaDto {
  agenda_loja_id: number;
  funcionario_id: number;
  automovel_id?: number;
  km_ida?: number;
  km_volta?: number;
  endereco_destino?: string;
  observacoes?: string;
  origem_registro?: string;
}

export interface RelatorioRotaFiltros {
  data_inicio?: string;
  data_fim?: string;
  funcionario_id?: number;
  cliente_id?: number;
  automovel_id?: number;
}

export interface ResumoCustosRotaFiltros extends RelatorioRotaFiltros {
  agenda_loja_ids?: number[];
  projeto_id?: number;
  garantia_id?: number;
  venda_id?: number;
}

@Injectable()
export class RotaCustoViagemService {
  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any { return this.prisma; }

  private buildWhere(filtros: ResumoCustosRotaFiltros = {}) {
    const where: Record<string, unknown> = {};

    if (filtros.funcionario_id) where['funcionario_id'] = filtros.funcionario_id;
    if (filtros.cliente_id) where['cliente_id'] = filtros.cliente_id;
    if (filtros.automovel_id) where['automovel_id'] = filtros.automovel_id;
    if (filtros.agenda_loja_ids?.length) {
      where['agenda_loja_id'] = { in: filtros.agenda_loja_ids };
    }
    if (filtros.data_inicio || filtros.data_fim) {
      const inicio = filtros.data_inicio ? new Date(filtros.data_inicio) : undefined;
      const fim = filtros.data_fim ? new Date(`${filtros.data_fim}T23:59:59`) : undefined;
      where['registrado_em'] = {
        ...(inicio ? { gte: inicio } : {}),
        ...(fim ? { lte: fim } : {}),
      };
    }

    const agendaWhere: Record<string, unknown> = {};
    if (filtros.projeto_id) agendaWhere['projeto_id'] = filtros.projeto_id;
    if (filtros.garantia_id) agendaWhere['garantia_id'] = filtros.garantia_id;
    if (filtros.venda_id) agendaWhere['venda_id'] = filtros.venda_id;
    if (Object.keys(agendaWhere).length) {
      where['agenda_loja'] = { is: agendaWhere };
    }

    return where;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Listar rotas com filtros
  // ─────────────────────────────────────────────────────────────────────────
  async findAll(filtros: RelatorioRotaFiltros = {}) {
    const where = this.buildWhere(filtros);

    return this.db.rotas_custo_viagem.findMany({
      where,
      include: {
        funcionario: { select: { id: true, nome: true } },
        automovel: { select: { id: true, descricao: true, placa: true, custo_km: true } },
        cliente: { select: { id: true, nome_completo: true } },
        agenda_loja: {
          select: {
            id: true,
            titulo: true,
            inicio_em: true,
            subetapa: true,
            cliente: { select: { id: true, nome_completo: true } },
          },
        },
      },
      orderBy: { registrado_em: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Buscar única rota
  // ─────────────────────────────────────────────────────────────────────────
  async findOne(id: number) {
    const rota = await this.db.rotas_custo_viagem.findUnique({
      where: { id },
      include: {
        funcionario: { select: { id: true, nome: true } },
        automovel: true,
        cliente: { select: { id: true, nome_completo: true, endereco: true, numero: true, bairro: true, cidade: true, estado: true } },
        agenda_loja: { select: { id: true, titulo: true, inicio_em: true, subetapa: true } },
      },
    });
    if (!rota) throw new NotFoundException(`Rota #${id} não encontrada`);
    return rota;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Criar rota (ao agendar medida fina já passa pelo service via totem/agenda)
  // ─────────────────────────────────────────────────────────────────────────
  async create(data: CreateRotaDto) {
    if (!data.agenda_loja_id || !data.funcionario_id) {
      throw new BadRequestException('agenda_loja_id e funcionario_id são obrigatórios');
    }

    // Busca veículo para snapshot de custo/km
    let custo_km_utilizado: number | null = null;
    let custo_total: number | null = null;

    if (data.automovel_id) {
      const automovel = await this.db.automoveis.findUnique({
        where: { id: data.automovel_id },
        select: { custo_km: true },
      });
      if (automovel?.custo_km != null) {
        custo_km_utilizado = Number(automovel.custo_km);
      }
    }

    const km_ida = data.km_ida ?? 0;
    const km_volta = data.km_volta ?? 0;
    const km_total = km_ida + km_volta;

    if (custo_km_utilizado != null) {
      custo_total = parseFloat((km_total * custo_km_utilizado).toFixed(4));
    }

    // Pega cliente da agenda para denormalização
    const agenda = await this.db.agenda_loja.findUnique({
      where: { id: data.agenda_loja_id },
      select: { cliente_id: true },
    });

    return this.db.rotas_custo_viagem.create({
      data: {
        agenda_loja_id: data.agenda_loja_id,
        funcionario_id: data.funcionario_id,
        automovel_id: data.automovel_id ?? null,
        cliente_id: agenda?.cliente_id ?? null,
        km_ida: km_ida,
        km_volta: km_volta,
        km_total,
        custo_km_utilizado,
        custo_total,
        endereco_destino: data.endereco_destino ?? null,
        observacoes: data.observacoes ?? null,
        origem_registro: data.origem_registro ?? 'MANUAL',
      },
      include: {
        funcionario: { select: { id: true, nome: true } },
        automovel: { select: { id: true, descricao: true, placa: true } },
        cliente: { select: { id: true, nome_completo: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Atualizar km / veículo (correção manual)
  // ─────────────────────────────────────────────────────────────────────────
  async update(id: number, data: Partial<CreateRotaDto>) {
    await this.findOne(id);

    let custo_km_utilizado: number | null = null;
    let custo_total: number | null = null;

    if (data.automovel_id) {
      const automovel = await this.db.automoveis.findUnique({
        where: { id: data.automovel_id },
        select: { custo_km: true },
      });
      if (automovel?.custo_km != null) custo_km_utilizado = Number(automovel.custo_km);
    }

    const km_total =
      data.km_ida !== undefined && data.km_volta !== undefined
        ? (data.km_ida ?? 0) + (data.km_volta ?? 0)
        : undefined;

    if (km_total != null && custo_km_utilizado != null) {
      custo_total = parseFloat((km_total * custo_km_utilizado).toFixed(4));
    }

    return this.db.rotas_custo_viagem.update({
      where: { id },
      data: {
        ...(data.automovel_id !== undefined ? { automovel_id: data.automovel_id } : {}),
        ...(data.km_ida !== undefined ? { km_ida: data.km_ida } : {}),
        ...(data.km_volta !== undefined ? { km_volta: data.km_volta } : {}),
        ...(km_total !== undefined ? { km_total } : {}),
        ...(custo_km_utilizado ? { custo_km_utilizado } : {}),
        ...(custo_total ? { custo_total } : {}),
        ...(data.endereco_destino !== undefined ? { endereco_destino: data.endereco_destino } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Relatório consolidado por período
  // ─────────────────────────────────────────────────────────────────────────
  async relatorio(filtros: RelatorioRotaFiltros = {}) {
    const rotas = await this.findAll(filtros);

    const totais = rotas.reduce(
      (acc, r) => {
        acc.km_total += Number(r.km_total ?? 0);
        acc.custo_total += Number(r.custo_total ?? 0);
        acc.viagens++;
        return acc;
      },
      { km_total: 0, custo_total: 0, viagens: 0 },
    );

    // Agrupado por funcionário
    const porFuncionario = new Map<number, { funcionario_id: number; nome: string; km_total: number; custo_total: number; viagens: number }>();
    for (const r of rotas) {
      const fId = r.funcionario_id;
      const entry = porFuncionario.get(fId) ?? {
        funcionario_id: fId,
        nome: (r.funcionario as { nome: string }).nome ?? '',
        km_total: 0,
        custo_total: 0,
        viagens: 0,
      };
      entry.km_total += Number(r.km_total ?? 0);
      entry.custo_total += Number(r.custo_total ?? 0);
      entry.viagens++;
      porFuncionario.set(fId, entry);
    }

    return {
      totais,
      por_funcionario: Array.from(porFuncionario.values()),
      rotas,
    };
  }

  async getResumoCustos(filtros: ResumoCustosRotaFiltros = {}) {
    const rotas = await this.db.rotas_custo_viagem.findMany({
      where: this.buildWhere(filtros),
      select: {
        id: true,
        agenda_loja_id: true,
        funcionario_id: true,
        km_total: true,
        custo_total: true,
      },
    });

    const porAgenda = new Map<number, { agenda_loja_id: number; km_total: number; custo_total: number; viagens: number }>();
    let km_total = 0;
    let custo_total = 0;

    for (const rota of rotas) {
      const km = Number(rota.km_total ?? 0);
      const custo = Number(rota.custo_total ?? 0);
      km_total += km;
      custo_total += custo;

      if (rota.agenda_loja_id != null) {
        const atual = porAgenda.get(rota.agenda_loja_id) ?? {
          agenda_loja_id: rota.agenda_loja_id,
          km_total: 0,
          custo_total: 0,
          viagens: 0,
        };
        atual.km_total += km;
        atual.custo_total += custo;
        atual.viagens += 1;
        porAgenda.set(rota.agenda_loja_id, atual);
      }
    }

    return {
      viagens: rotas.length,
      km_total: Number(km_total.toFixed(4)),
      custo_total: Number(custo_total.toFixed(4)),
      por_agenda_loja: Array.from(porAgenda.values()),
    };
  }
}
