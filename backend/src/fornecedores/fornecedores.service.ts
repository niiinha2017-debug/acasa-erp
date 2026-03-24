import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedorDto } from './dto/criar-fornecedor.dto';
import { UpdateFornecedorDto } from './dto/atualizar-fornecedor.dto';

@Injectable()
export class FornecedorService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fornecedorSelect = {
    id: true,
    razao_social: true,
    nome_fantasia: true,
    cnpj: true,
    ie: true,
    telefone: true,
    whatsapp: true,
    email: true,
    cep: true,
    endereco: true,
    numero: true,
    complemento: true,
    bairro: true,
    cidade: true,
    estado: true,
    forma_pagamento: true,
    regime_financeiro_padrao: true,
    dia_fechamento_padrao: true,
    permite_multiplas_formas: true,
    data_vencimento: true,
    ramo_atividade: true,
    prazo_entrega_dias: true,
    criado_em: true,
    atualizado_em: true,
    formas_pagamento_habilitadas: {
      where: { ativo: true },
      select: {
        id: true,
        forma_pagamento_chave: true,
        parcelas_padrao: true,
        ativo: true,
      },
      orderBy: { forma_pagamento_chave: 'asc' },
    },
  } satisfies Prisma.FornecedorSelect;

  private normalizeFormasPagto(
    items?: Array<{ forma_pagamento_chave?: string; parcelas_padrao?: number }>,
  ) {
    if (!Array.isArray(items)) return [];
    const map = new Map<string, { forma_pagamento_chave: string; parcelas_padrao: number | null }>();
    for (const item of items) {
      const chave = String(item?.forma_pagamento_chave || '')
        .trim()
        .toUpperCase();
      if (!chave) continue;
      const parcelas = Number(item?.parcelas_padrao);
      map.set(chave, {
        forma_pagamento_chave: chave,
        parcelas_padrao:
          Number.isFinite(parcelas) && parcelas > 0 ? Math.trunc(parcelas) : null,
      });
    }
    return Array.from(map.values());
  }

  async listar() {
    return this.prisma.fornecedor.findMany({
      orderBy: { id: 'desc' },
      select: this.fornecedorSelect,
    });
  }

  async buscarPorId(id: number) {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
      select: this.fornecedorSelect,
    });

    if (!fornecedor) throw new NotFoundException('Fornecedor não encontrado.');
    return fornecedor;
  }

  async criar(dto: CreateFornecedorDto) {
    try {
      const formas = this.normalizeFormasPagto(dto.formas_pagamento_habilitadas);
      const created = await this.prisma.$transaction(async (tx) => {
        const fornecedor = await tx.fornecedor.create({
          data: {
            razao_social: dto.razao_social,
            nome_fantasia: dto.nome_fantasia,
            cnpj: dto.cnpj,
            ie: dto.ie ?? null,
            telefone: dto.telefone ?? null,
            whatsapp: dto.whatsapp ?? null,
            email: dto.email ?? null,
            cep: dto.cep ?? null,
            endereco: dto.endereco ?? null,
            numero: dto.numero ?? null,
            complemento: dto.complemento ?? null,
            bairro: dto.bairro ?? null,
            cidade: dto.cidade ?? null,
            estado: dto.estado ?? null,
            forma_pagamento: dto.forma_pagamento ?? null,
            regime_financeiro_padrao:
              String(dto.regime_financeiro_padrao || '').trim() ||
              'FECHAMENTO_MENSAL',
            dia_fechamento_padrao: dto.dia_fechamento_padrao ?? null,
            permite_multiplas_formas: dto.permite_multiplas_formas ?? false,
            data_vencimento: dto.data_vencimento ?? null,
            ramo_atividade: dto.ramo_atividade ?? null,
            prazo_entrega_dias: dto.prazo_entrega_dias ?? null,
          },
          select: { id: true },
        });

        if (formas.length) {
          await tx.fornecedor_formas_pagamento.createMany({
            data: formas.map((f) => ({
              fornecedor_id: fornecedor.id,
              forma_pagamento_chave: f.forma_pagamento_chave,
              parcelas_padrao: f.parcelas_padrao,
              ativo: true,
            })),
          });
        }

        return tx.fornecedor.findUnique({
          where: { id: fornecedor.id },
          select: this.fornecedorSelect,
        });
      });
      return created;
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('CNPJ já cadastrado.');
      }
      throw e;
    }
  }

  async select(q?: string) {
    const termo = String(q || '').trim();

    const rows = await this.prisma.fornecedor.findMany({
      where: termo
        ? {
            OR: [
              { razao_social: { contains: termo } },
              { nome_fantasia: { contains: termo } },
              { cnpj: { contains: termo } },
            ],
          }
        : undefined,
      select: { id: true, razao_social: true, nome_fantasia: true, cnpj: true },
      orderBy: { razao_social: 'asc' },
      take: 50,
    });

    return rows.map((f) => ({
      value: f.id,
      label: f.nome_fantasia || f.razao_social || `ID #${f.id}`,
    }));
  }

  async atualizar(id: number, dto: UpdateFornecedorDto) {
    await this.buscarPorId(id);

    try {
      const formas = this.normalizeFormasPagto(dto.formas_pagamento_habilitadas as any);
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.fornecedor.update({
          where: { id },
          data: {
            razao_social: dto.razao_social,
            nome_fantasia: dto.nome_fantasia,
            cnpj: dto.cnpj,
            ie: dto.ie,
            telefone: dto.telefone,
            whatsapp: dto.whatsapp,
            email: dto.email,
            cep: dto.cep,
            endereco: dto.endereco,
            numero: dto.numero,
            complemento: dto.complemento,
            bairro: dto.bairro,
            cidade: dto.cidade,
            estado: dto.estado,
            forma_pagamento: dto.forma_pagamento,
            regime_financeiro_padrao:
              dto.regime_financeiro_padrao !== undefined
                ? String(dto.regime_financeiro_padrao || '').trim() ||
                  'FECHAMENTO_MENSAL'
                : undefined,
            dia_fechamento_padrao: dto.dia_fechamento_padrao,
            permite_multiplas_formas: dto.permite_multiplas_formas,
            data_vencimento: dto.data_vencimento,
            ramo_atividade: dto.ramo_atividade,
            prazo_entrega_dias: dto.prazo_entrega_dias,
          },
        });

        if (dto.formas_pagamento_habilitadas !== undefined) {
          await tx.fornecedor_formas_pagamento.deleteMany({
            where: { fornecedor_id: id },
          });
          if (formas.length) {
            await tx.fornecedor_formas_pagamento.createMany({
              data: formas.map((f) => ({
                fornecedor_id: id,
                forma_pagamento_chave: f.forma_pagamento_chave,
                parcelas_padrao: f.parcelas_padrao,
                ativo: true,
              })),
            });
          }
        }

        return tx.fornecedor.findUnique({
          where: { id },
          select: this.fornecedorSelect,
        });
      });
      return updated;
    } catch (e: any) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('CNPJ já cadastrado.');
      }
      throw e;
    }
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    await this.prisma.fornecedor.delete({ where: { id } });
    return { ok: true };
  }
}
