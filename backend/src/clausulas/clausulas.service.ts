import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CLAUSULAS_DEFAULTS } from './clausulas.defaults';

export interface ClausulaModuloDto {
  id?: number;
  modulo_key: string;
  titulo: string;
  texto: string;
  ordem?: number;
}

export interface UpdateClausulasDto {
  modulos: ClausulaModuloDto[];
}

@Injectable()
export class ClausulasService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTipo(tipo: string): string {
    return String(tipo || '')
      .trim()
      .toUpperCase();
  }

  private isBlankText(value: string | null | undefined): boolean {
    return String(value ?? '').trim().length === 0;
  }

  async buscarOuCriarPorTipo(tipo: string) {
    const t = this.normalizeTipo(tipo);

    const existentes = await this.prisma.clausulas_modelos.findMany({
      where: { tipo: t },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });

    const padroes = CLAUSULAS_DEFAULTS[t] || [];

    // cria módulos padrão que ainda não existirem
    const faltando = padroes.filter(
      (pad) => !existentes.some((e) => e.modulo_key === pad.modulo_key),
    );

    if (faltando.length) {
      await this.prisma.clausulas_modelos.createMany({
        data: faltando.map((f) => ({
          tipo: t,
          modulo_key: f.modulo_key,
          titulo: f.titulo,
          texto: f.texto,
          ordem: f.ordem,
        })),
      });
    }

    const todos = await this.prisma.clausulas_modelos.findMany({
      where: { tipo: t },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });

    const defaultsPorKey = new Map(
      padroes.map((padrao) => [padrao.modulo_key, padrao]),
    );

    const registrosParaAtualizar = todos
      .map((row) => {
        const padrao = defaultsPorKey.get(row.modulo_key);
        if (!padrao) {
          return null;
        }

        const proximoTitulo = padrao.titulo;
        const proximaOrdem = padrao.ordem;
        const proximoTexto = this.isBlankText(row.texto) ? padrao.texto : row.texto;

        if (
          row.titulo === proximoTitulo &&
          row.ordem === proximaOrdem &&
          row.texto === proximoTexto
        ) {
          return null;
        }

        return {
          id: row.id,
          titulo: proximoTitulo,
          ordem: proximaOrdem,
          texto: proximoTexto,
        };
      })
      .filter(Boolean);

    if (registrosParaAtualizar.length > 0) {
      await this.prisma.$transaction(
        registrosParaAtualizar.map((registro) =>
          this.prisma.clausulas_modelos.update({
            where: { id: registro!.id },
            data: {
              titulo: registro!.titulo,
              ordem: registro!.ordem,
              texto: registro!.texto,
            },
          }),
        ),
      );

      return this.prisma.clausulas_modelos.findMany({
        where: { tipo: t },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
      });
    }

    return todos;
  }

  async salvarPorTipo(tipo: string, dto: UpdateClausulasDto) {
    const t = this.normalizeTipo(tipo);

    const incoming = Array.isArray(dto.modulos) ? dto.modulos : [];

    try {
      // Atualiza ou cria cada módulo recebido
      for (const mod of incoming) {
        const key = String(mod.modulo_key || '')
          .trim()
          .toUpperCase();
        if (!key) continue;

        const data = {
          titulo: String(mod.titulo ?? '').slice(0, 191),
          texto: String(mod.texto ?? ''),
          ordem: typeof mod.ordem === 'number' ? mod.ordem : 0,
        };

        const existente = await this.prisma.clausulas_modelos.findFirst({
          where: { tipo: t, modulo_key: key },
        });

        if (existente) {
          await this.prisma.clausulas_modelos.update({
            where: { id: existente.id },
            data,
          });
        } else {
          await this.prisma.clausulas_modelos.create({
            data: {
              tipo: t,
              modulo_key: key,
              ...data,
            },
          });
        }
      }

      // retorna lista atualizada
      return this.prisma.clausulas_modelos.findMany({
        where: { tipo: t },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'Já existe um módulo com este tipo e chave.',
          );
        }
        if (e.code === 'P2003' || e.code === 'P2016') {
          throw new BadRequestException(
            'Registro referenciado não encontrado.',
          );
        }
        // ex.: P2016 = registro não encontrado; dados longos demais etc.
        throw new BadRequestException(e.message || 'Erro ao salvar cláusulas.');
      }
      throw e;
    }
  }
}
