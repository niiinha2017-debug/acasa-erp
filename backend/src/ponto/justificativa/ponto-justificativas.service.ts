import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalvarPontoJustificativaDto } from '../justificativa/salvar-ponto-justificativa.dto';

function asDia00(data: string) {
  // força 00:00:00
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida');
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class PontoJustificativasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(params: {
    funcionario_id?: string;
    mes?: string;
    ano?: string;
    data_ini?: string;
    data_fim?: string;
  }) {
    const funcionario_id = params.funcionario_id
      ? Number(String(params.funcionario_id).replace(/\D/g, ''))
      : undefined;
    const mes = params.mes
      ? Number(String(params.mes).replace(/\D/g, ''))
      : undefined;
    const ano = params.ano
      ? Number(String(params.ano).replace(/\D/g, ''))
      : undefined;

    let dataIni: Date | undefined;
    let dataFim: Date | undefined;

    if (params.data_ini && params.data_fim) {
      dataIni = asDia00(params.data_ini);
      dataFim = new Date(asDia00(params.data_fim).getTime() + 24 * 60 * 60 * 1000); // fim do dia + 1ms (exclusivo)
    } else if (mes && ano) {
      dataIni = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
      dataFim = new Date(ano, mes, 1, 0, 0, 0, 0); // exclusivo
    }

    return this.prisma.ponto_justificativas.findMany({
      where: {
        funcionario_id,
        ...(dataIni && dataFim ? { data: { gte: dataIni, lt: dataFim } } : {}),
      },
      orderBy: [{ data: 'asc' }],
    });
  }

  async salvar(dto: SalvarPontoJustificativaDto) {
    const dataIni = asDia00(dto.data);
    const dataFimStr = dto.data_fim?.trim();
    const dataFimInclusive = dataFimStr ? asDia00(dataFimStr) : null;
    const minutosJust = dto.minutos_justificados != null ? Number(dto.minutos_justificados) : null;

    const dias: Date[] = [];
    if (dataFimInclusive && dataFimInclusive.getTime() >= dataIni.getTime()) {
      for (let d = new Date(dataIni); d.getTime() <= dataFimInclusive.getTime(); d.setDate(d.getDate() + 1)) {
        dias.push(new Date(d));
      }
    } else {
      dias.push(new Date(dataIni));
    }

    const payload = {
      funcionario_id: dto.funcionario_id,
      tipo: dto.tipo,
      descricao: dto.descricao ?? null,
      arquivo_id: dto.arquivo_id ?? null,
      minutos_justificados: minutosJust,
    };

    const resultados: any[] = [];
    for (const data of dias) {
      const existente = await this.prisma.ponto_justificativas.findFirst({
        where: { funcionario_id: dto.funcionario_id, data },
        select: { id: true },
      });

      if (!existente) {
        resultados.push(
          await this.prisma.ponto_justificativas.create({
            data: { ...payload, data },
          }),
        );
      } else {
        resultados.push(
          await this.prisma.ponto_justificativas.update({
            where: { id: existente.id },
            data: {
              tipo: payload.tipo,
              descricao: payload.descricao,
              ...(dto.arquivo_id !== undefined && { arquivo_id: payload.arquivo_id }),
              minutos_justificados: payload.minutos_justificados,
            },
          }),
        );
      }
    }

    return resultados.length === 1 ? resultados[0] : { criados: resultados.length, itens: resultados };
  }

  async remover(id: number) {
    return this.prisma.ponto_justificativas.delete({ where: { id } });
  }
}
