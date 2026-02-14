import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.contratos.findMany({
      orderBy: { id: 'desc' },
      include: { cliente: true, venda: true },
    });
  }

  async buscarPorId(id: number) {
    const contrato = await this.prisma.contratos.findUnique({
      where: { id },
      include: { cliente: true, venda: { include: { orcamento: true } } },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    return contrato;
  }

  async criar(dto: CreateContratoDto) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    if (dto.venda_id != null) {
      const venda = await this.prisma.vendas.findUnique({
        where: { id: dto.venda_id },
      });
      if (!venda) throw new NotFoundException('Venda não encontrada.');
    }

    return this.prisma.contratos.create({
      data: {
        cliente_id: dto.cliente_id,
        venda_id: dto.venda_id ?? null,
        numero: dto.numero,
        descricao: dto.descricao ?? null,
        status: dto.status,
        valor: dto.valor,
        data_inicio: dto.data_inicio ? new Date(dto.data_inicio) : null,
        data_fim: dto.data_fim ? new Date(dto.data_fim) : null,
      },
      include: { cliente: true, venda: true },
    });
  }

  async atualizar(id: number, dto: UpdateContratoDto) {
    await this.buscarPorId(id);

    if (dto.venda_id !== undefined && dto.venda_id != null) {
      const venda = await this.prisma.vendas.findUnique({
        where: { id: dto.venda_id },
      });
      if (!venda) throw new NotFoundException('Venda não encontrada.');
    }

    return this.prisma.contratos.update({
      where: { id },
      data: {
        venda_id: dto.venda_id ?? undefined,
        numero: dto.numero,
        descricao: dto.descricao,
        status: dto.status,
        valor: dto.valor,
        data_inicio: dto.data_inicio ? new Date(dto.data_inicio) : undefined,
        data_fim: dto.data_fim ? new Date(dto.data_fim) : undefined,
      },
      include: { cliente: true, venda: true },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.prisma.contratos.delete({ where: { id } });
  }
}
