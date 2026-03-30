import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAutomovelDto {
  placa: string;
  descricao: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  renavam?: string;
  chassi?: string;
  combustivel?: string;
  custo_km?: number;
  observacoes?: string;
  status?: string;
}

export type UpdateAutomovelDto = Partial<CreateAutomovelDto>;

@Injectable()
export class AutomoveisService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.automoveis.findMany({
      where: status ? { status } : undefined,
      orderBy: { descricao: 'asc' },
    });
  }

  async findOne(id: number) {
    const automovel = await this.prisma.automoveis.findUnique({ where: { id } });
    if (!automovel) throw new NotFoundException(`Automóvel #${id} não encontrado`);
    return automovel;
  }

  create(data: CreateAutomovelDto) {
    return this.prisma.automoveis.create({
      data: {
        placa: data.placa.toUpperCase().replace(/\s/g, ''),
        descricao: data.descricao,
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        cor: data.cor,
        renavam: data.renavam,
        chassi: data.chassi,
        combustivel: data.combustivel,
        custo_km: data.custo_km,
        observacoes: data.observacoes,
        status: data.status ?? 'ATIVO',
      },
    });
  }

  async update(id: number, data: UpdateAutomovelDto) {
    await this.findOne(id);
    return this.prisma.automoveis.update({
      where: { id },
      data: {
        ...data,
        placa: data.placa ? data.placa.toUpperCase().replace(/\s/g, '') : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.automoveis.delete({ where: { id } });
  }

  // Retorna resumo do patrimônio de frota
  async relatorioPatrimonio() {
    const veiculos = await this.prisma.automoveis.findMany({
      orderBy: { status: 'asc' },
    });

    const totais = veiculos.reduce(
      (acc, v) => {
        acc.total++;
        if (v.status === 'ATIVO') acc.ativos++;
        else if (v.status === 'INATIVO') acc.inativos++;
        else if (v.status === 'MANUTENCAO') acc.manutencao++;
        return acc;
      },
      { total: 0, ativos: 0, inativos: 0, manutencao: 0 },
    );

    return { totais, veiculos };
  }
}
