import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanoCorteProjetoDto,
  CreatePlanoCorteProjetoPecaDto,
} from './dto/create-plano-corte-projeto.dto';

@Injectable()
export class PlanoCorteProjetoService {
  constructor(private readonly prisma: PrismaService) {}

  calcularMedidasReais(peca: CreatePlanoCorteProjetoPecaDto) {
    const larguraNominal = Number(peca.largura_nominal_mm || 0);
    const alturaNominal = Number(peca.altura_nominal_mm || 0);
    const fitaTopo = Number(peca.fita_topo_mm || 0);
    const fitaBase = Number(peca.fita_base_mm || 0);
    const fitaEsquerda = Number(peca.fita_esquerda_mm || 0);
    const fitaDireita = Number(peca.fita_direita_mm || 0);

    const larguraCorte = larguraNominal - fitaEsquerda - fitaDireita;
    const alturaCorte = alturaNominal - fitaTopo - fitaBase;

    if (larguraCorte <= 0 || alturaCorte <= 0) {
      throw new BadRequestException(
        'Medidas de corte inválidas: largura/altura nominal menos fitas deve resultar em valor positivo.',
      );
    }

    return {
      largura_corte_mm: Number(larguraCorte.toFixed(2)),
      altura_corte_mm: Number(alturaCorte.toFixed(2)),
    };
  }

  async create(dto: CreatePlanoCorteProjetoDto) {
    return this.prisma.$transaction(async (tx) => {
      const projeto = await tx.plano_corte_projeto.create({
        data: {
          plano_corte_id: dto.plano_corte_id ?? null,
          nome: dto.nome,
          material: dto.material ?? null,
          espessura_mm:
            dto.espessura_mm != null ? new Prisma.Decimal(dto.espessura_mm) : null,
          kerf_mm: new Prisma.Decimal(dto.kerf_mm),
          status: 'RASCUNHO',
        },
      });

      for (const peca of dto.pecas) {
        const medidasReais = this.calcularMedidasReais(peca);
        await tx.plano_corte_projeto_peca.create({
          data: {
            plano_corte_projeto_id: projeto.id,
            nome: peca.nome,
            largura_nominal_mm: new Prisma.Decimal(peca.largura_nominal_mm),
            altura_nominal_mm: new Prisma.Decimal(peca.altura_nominal_mm),
            quantidade: peca.quantidade,
            girar_peca: peca.girar_peca,
            fita_topo_mm: new Prisma.Decimal(peca.fita_topo_mm),
            fita_base_mm: new Prisma.Decimal(peca.fita_base_mm),
            fita_esquerda_mm: new Prisma.Decimal(peca.fita_esquerda_mm),
            fita_direita_mm: new Prisma.Decimal(peca.fita_direita_mm),
            largura_corte_mm: new Prisma.Decimal(medidasReais.largura_corte_mm),
            altura_corte_mm: new Prisma.Decimal(medidasReais.altura_corte_mm),
          },
        });
      }

      for (const chapa of dto.chapas) {
        await tx.plano_corte_projeto_chapa.create({
          data: {
            plano_corte_projeto_id: projeto.id,
            produto_id: chapa.produto_id ?? null,
            codigo: chapa.codigo ?? null,
            material: chapa.material ?? null,
            largura_mm: new Prisma.Decimal(chapa.largura_mm),
            altura_mm: new Prisma.Decimal(chapa.altura_mm),
            quantidade: chapa.quantidade,
          },
        });
      }

      return tx.plano_corte_projeto.findUnique({
        where: { id: projeto.id },
        include: {
          pecas: true,
          chapas: true,
          plano_corte: true,
        },
      });
    });
  }
}
