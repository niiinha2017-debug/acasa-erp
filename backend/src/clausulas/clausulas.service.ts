import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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

const DEFAULT_MODULOS: Record<
  string,
  { modulo_key: string; titulo: string; ordem: number }[]
> = {
  ORCAMENTO: [
    { modulo_key: 'OBJETO', titulo: 'Cláusula Primeira: Do Objeto', ordem: 1 },
    {
      modulo_key: 'PRECO_CONDICOES',
      titulo: 'Cláusula Segunda: Do Preço e Condições de Pagamento',
      ordem: 2,
    },
    {
      modulo_key: 'PRAZO_VALIDADE',
      titulo: 'Cláusula Terceira: Do Prazo de Validade do Orçamento',
      ordem: 3,
    },
  ],
  CONTRATO: [
    {
      modulo_key: 'CABECALHO',
      titulo: 'Contrato de Compra e Venda de Mercadorias e Prestação de Serviços',
      ordem: 0,
    },
    { modulo_key: 'OBJETO', titulo: 'Cláusula Primeira: Do Objeto', ordem: 1 },
    {
      modulo_key: 'PRECO_CONDICOES',
      titulo: 'Cláusula Segunda: Do Preço e Condição de Pagamento',
      ordem: 2,
    },
    {
      modulo_key: 'PRAZO_ENTREGA',
      titulo: 'Cláusula Terceira: Do Prazo de Entrega dos Bens',
      ordem: 3,
    },
    {
      modulo_key: 'ARMAZENAGEM_DESISTENCIA',
      titulo: 'Cláusula Quarta: Da Armazenagem e da Desistência',
      ordem: 4,
    },
    {
      modulo_key: 'GARANTIA',
      titulo: 'Cláusula Quinta: Da Garantia',
      ordem: 5,
    },
    {
      modulo_key: 'SERVICOS',
      titulo: 'Cláusula Sexta: Dos Serviços',
      ordem: 6,
    },
    {
      modulo_key: 'CONDICOES_GERAIS',
      titulo: 'Cláusula Sétima: Das Condições Gerais',
      ordem: 7,
    },
    {
      modulo_key: 'RESPONSABILIDADES',
      titulo: 'Cláusula Oitava: Das Responsabilidades e Obrigações',
      ordem: 8,
    },
    {
      modulo_key: 'CESSAO_IMAGEM',
      titulo: 'Cláusula Nona: Da Cessão de Imagem e Voz',
      ordem: 9,
    },
    {
      modulo_key: 'FORO',
      titulo: 'Cláusula Décima: Do Foro',
      ordem: 10,
    },
    {
      modulo_key: 'ASSINATURA_ELETRONICA',
      titulo: 'Cláusula 11ª – Da Assinatura Eletrônica e Aceite por Meios Digitais',
      ordem: 11,
    },
  ],
};

@Injectable()
export class ClausulasService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeTipo(tipo: string): string {
    return String(tipo || '').trim().toUpperCase();
  }

  async buscarOuCriarPorTipo(tipo: string) {
    const t = this.normalizeTipo(tipo);

    const existentes = await this.prisma.clausulas_modelos.findMany({
      where: { tipo: t },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });

    const padroes = DEFAULT_MODULOS[t] || [];

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
          texto: '',
          ordem: f.ordem,
        })),
      });
    }

    const todos = await this.prisma.clausulas_modelos.findMany({
      where: { tipo: t },
      orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
    });

    // Para CONTRATO: corrige títulos pela numeração canônica (evita duas "Oitava" etc.)
    if (t === 'CONTRATO' && padroes.length > 0) {
      const tituloPorKey = Object.fromEntries(
        padroes.map((p) => [p.modulo_key, p.titulo]),
      );
      return todos.map((row) => {
        const tituloCanonico = tituloPorKey[row.modulo_key];
        return {
          ...row,
          titulo: tituloCanonico ?? row.titulo,
        };
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
        const key = String(mod.modulo_key || '').trim().toUpperCase();
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
          throw new BadRequestException('Já existe um módulo com este tipo e chave.');
        }
        if (e.code === 'P2003' || e.code === 'P2016') {
          throw new BadRequestException('Registro referenciado não encontrado.');
        }
        // ex.: P2016 = registro não encontrado; dados longos demais etc.
        throw new BadRequestException(e.message || 'Erro ao salvar cláusulas.');
      }
      throw e;
    }
  }
}

