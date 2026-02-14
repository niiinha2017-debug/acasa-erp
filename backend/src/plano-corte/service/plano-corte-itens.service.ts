import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanoCorteItemDto } from '../dto/create-plano-corte-iten.dto';
import { UpdatePlanoCorteItemDto } from '../dto/update-plano-corte-iten.dto';

@Injectable()
export class PlanoCorteItensService {
  constructor(private readonly prisma: PrismaService) {}

  private normStr(v: any): string | null {
    const s = String(v ?? '').trim();
    return s.length ? s : null;
  }

  /** Bloqueia duplicata: mesmo fornecedor + nome + marca + cor + medida. */
  private async checarDuplicado(params: {
    fornecedor_id: number;
    nome_produto: string;
    marca: string | null;
    cor: string | null;
    medida: string | null;
    ignorarId?: number;
  }) {
    const nome = String(params.nome_produto ?? '').trim();
    if (!nome) return;

    const dup = await this.prisma.plano_corte_item.findFirst({
      where: {
        fornecedor_id: params.fornecedor_id,
        nome_produto: nome,
        marca: params.marca ?? null,
        cor: params.cor ?? null,
        medida: params.medida ?? null,
        ...(params.ignorarId != null ? { id: { not: params.ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (dup) {
      throw new BadRequestException(
        'Já existe um item com o mesmo fornecedor, nome do produto, marca, cor e medida. Não é permitido duplicar.',
      );
    }
  }

  async listar(fornecedor_id?: number) {
    return this.prisma.plano_corte_item.findMany({
      where: fornecedor_id ? { fornecedor_id } : {},
      orderBy: { nome_produto: 'asc' },
    });
  }

  async buscar(id: number) {
    const item = await this.prisma.plano_corte_item.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`Item #${id} não encontrado.`);
    return item;
  }

  async criar(dto: CreatePlanoCorteItemDto) {
    const nome_produto = String(dto.nome_produto ?? '').trim();
    if (!nome_produto) {
      throw new BadRequestException('nome_produto é obrigatório.');
    }

    const marca = this.normStr(dto.marca);
    const cor = this.normStr(dto.cor);
    const medida = this.normStr(dto.medida);

    await this.checarDuplicado({
      fornecedor_id: dto.fornecedor_id,
      nome_produto,
      marca,
      cor,
      medida,
    });

    try {
      return await this.prisma.plano_corte_item.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          nome_produto,
          marca,
          cor,
          medida,
          unidade: dto.unidade ?? null,
          largura_mm: dto.largura_mm ?? null,
          comprimento_mm: dto.comprimento_mm ?? null,
          espessura_mm: dto.espessura_mm ?? null,
          preco_m2: dto.preco_m2 ?? null,
          quantidade: dto.quantidade,
          valor_unitario: dto.valor_unitario,
          valor_total: dto.valor_total,
          status: dto.status,
        },
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Item já cadastrado.');
      }
      throw e;
    }
  }

  async atualizar(id: number, dto: UpdatePlanoCorteItemDto) {
    const atual = await this.buscar(id);

    const fornecedor_id = dto.fornecedor_id ?? atual.fornecedor_id;
    const nome_produto = dto.nome_produto !== undefined
      ? String(dto.nome_produto).trim()
      : atual.nome_produto;
    const marca = dto.marca !== undefined ? this.normStr(dto.marca) : (atual.marca ?? null);
    const cor = dto.cor !== undefined ? this.normStr(dto.cor) : (atual.cor ?? null);
    const medida = dto.medida !== undefined ? this.normStr(dto.medida) : (atual.medida ?? null);

    if (nome_produto) {
      await this.checarDuplicado({
        fornecedor_id,
        nome_produto,
        marca,
        cor,
        medida,
        ignorarId: id,
      });
    }

    try {
      return await this.prisma.plano_corte_item.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id ?? atual.fornecedor_id,
          nome_produto: nome_produto || atual.nome_produto,
          marca: dto.marca !== undefined ? this.normStr(dto.marca) : atual.marca,
          cor: dto.cor !== undefined ? this.normStr(dto.cor) : atual.cor,
          medida: dto.medida !== undefined ? this.normStr(dto.medida) : atual.medida,
          unidade: dto.unidade ?? atual.unidade,
          largura_mm: dto.largura_mm ?? atual.largura_mm,
          comprimento_mm: dto.comprimento_mm ?? atual.comprimento_mm,
          espessura_mm: dto.espessura_mm ?? atual.espessura_mm,
          preco_m2: dto.preco_m2 ?? atual.preco_m2,
          quantidade: dto.quantidade ?? atual.quantidade,
          valor_unitario: dto.valor_unitario ?? atual.valor_unitario,
          valor_total: dto.valor_total ?? atual.valor_total,
          status: dto.status ?? atual.status,
        },
      });
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Item já cadastrado.');
      }
      throw e;
    }
  }

  async remover(id: number) {
    await this.buscar(id);
    await this.prisma.plano_corte_item.delete({ where: { id } });
    return { ok: true };
  }
}
