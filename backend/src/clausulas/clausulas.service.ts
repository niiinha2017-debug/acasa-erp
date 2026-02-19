import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      modulo_key: 'GARANTIA',
      titulo: 'Cláusula Quarta: Da Garantia',
      ordem: 4,
    },
    {
      modulo_key: 'SERVICOS',
      titulo: 'Cláusula Quinta: Dos Serviços',
      ordem: 5,
    },
    {
      modulo_key: 'CONDICOES_GERAIS',
      titulo: 'Cláusula Sexta: Das Condições Gerais',
      ordem: 6,
    },
    {
      modulo_key: 'RESPONSABILIDADES',
      titulo: 'Cláusula Sétima: Das Responsabilidades e Obrigações',
      ordem: 7,
    },
    {
      modulo_key: 'CESSAO_IMAGEM',
      titulo: 'Cláusula Oitava: Da Cessão de Imagem e Voz',
      ordem: 8,
    },
    {
      modulo_key: 'FORO',
      titulo: 'Cláusula Nona: Do Foro',
      ordem: 9,
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

    return todos;
  }

  async salvarPorTipo(tipo: string, dto: UpdateClausulasDto) {
    const t = this.normalizeTipo(tipo);

    const incoming = Array.isArray(dto.modulos) ? dto.modulos : [];

    // Atualiza ou cria cada módulo recebido
    for (const mod of incoming) {
      const key = String(mod.modulo_key || '').trim().toUpperCase();
      if (!key) continue;

      const data = {
        titulo: mod.titulo || '',
        texto: mod.texto || '',
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
  }
}

