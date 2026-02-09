import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AtualizarPontoRegistroDto } from '../dto/atualizar-ponto-registro.dto';
import { CriarPontoRegistroDto } from '../dto/criar-ponto-registro.dto';
import { PontoOrigem, PontoTipoRegistro } from '@prisma/client';

@Injectable()
export class PontoRegistrosService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDataHora(raw: any): Date {
    // aceita "2026-01-31 13:30:00" ou "2026-01-31T13:30"
    const s = String(raw || '').trim();
    if (!s) throw new BadRequestException('data_hora é obrigatória');
    const isoLike = s.includes('T') ? s : s.replace(' ', 'T');
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) throw new BadRequestException('data_hora inválida');
    return d;
  }

  async criar(dto: CriarPontoRegistroDto) {
    const funcionario_id = Number(dto.funcionario_id);
    if (!funcionario_id)
      throw new BadRequestException('funcionario_id inválido');

    const data_hora = this.parseDataHora(dto.data_hora);
    const tipo =
      String(dto.tipo || '')
        .toUpperCase()
        .trim() === 'SAIDA'
        ? PontoTipoRegistro.SAIDA
        : PontoTipoRegistro.ENTRADA;

    return this.prisma.ponto_registros.create({
      data: {
        funcionario_id,
        dispositivo_id: null,
        tipo,
        origem: PontoOrigem.ADMIN,
        data_hora,
        status: 'ATIVO',
        observacao: dto.observacao ?? null,
        latitude: null,
        longitude: null,
        precisao_metros: null,
        ip: null,
        user_agent: null,
        cep: null,
        bairro: null,
        cidade: null,
        estado: null,
        rua: null,
      },
      select: {
        id: true,
        tipo: true,
        data_hora: true,
        status: true,
        observacao: true,
        funcionario_id: true,
      },
    });
  }

  async atualizar(id: number, dto: AtualizarPontoRegistroDto) {
    if (!id) throw new BadRequestException('ID inválido');

    const existe = await this.prisma.ponto_registros.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException('Registro não encontrado');

    const dataHora = dto.data_hora
      ? this.parseDataHora(dto.data_hora)
      : undefined;

    return this.prisma.ponto_registros.update({
      where: { id },
      data: {
        ...(dataHora && { data_hora: dataHora }),
        ...(dto.tipo && { tipo: dto.tipo as PontoTipoRegistro }),
        ...(dto.observacao !== undefined && { observacao: dto.observacao }),
      },
      select: {
        id: true,
        tipo: true,
        data_hora: true,
        status: true,
        observacao: true,
        funcionario_id: true,
      },
    });
  }

  async remover(id: number) {
    if (!id) throw new BadRequestException('ID inválido');

    const existe = await this.prisma.ponto_registros.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException('Registro não encontrado');

    // DELETE REAL
    return this.prisma.ponto_registros.delete({
      where: { id },
      select: { id: true },
    });
  }
}
