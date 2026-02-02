import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto'
import { randomUUID } from 'crypto'


@Injectable()
export class PlanoCorteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanoCorteDto) {
    return this.prisma.$transaction(async (tx) => {
      // soma com Decimal (evita ruído de float)
      const total = dto.produtos.reduce(
        (acc, p) => acc.plus(new Prisma.Decimal(p.valor_total || 0)),
        new Prisma.Decimal(0),
      )

      const plano = await tx.plano_corte.create({
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: new Date(dto.data_venda),
          status: dto.status,
          valor_total: total,
        },
      })

      for (const p of dto.produtos) {
        await tx.plano_corte_produto.create({
          data: {
            plano_corte_id: plano.id,
            item_id: p.item_id,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.valor_total,
            status: p.status,
          },
        })

        // atualiza histórico do item vendido (campos já existem no schema)
        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: new Date(dto.data_venda),
          },
        })
      }

      // opcional: devolver já completo (pra front não ter que refetch)
      return tx.plano_corte.findUnique({
        where: { id: plano.id },
        include: {
          fornecedor: true,
          produtos: { include: { item: true } },
          consumos: { include: { produto: true } },
        },
      })
    })
  }

  async findAll() {
    return this.prisma.plano_corte.findMany({
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
      orderBy: { data_venda: 'desc' },
    })
  }

  async findOne(id: number) {
    const plano = await this.prisma.plano_corte.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
    })

    if (!plano) throw new NotFoundException(`Plano de Corte #${id} não encontrado.`)
    return plano
  }

async update(id: number, dto: UpdatePlanoCorteDto) {
  await this.findOne(id);

  return this.prisma.$transaction(async (tx) => {
    // 1. Se houver produtos no DTO, atualizamos a lista
    if (dto.produtos) {
      // Remove os itens antigos para evitar duplicidade ou lixo
      await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } });

      for (const p of dto.produtos) {
        // FORÇAMOS O CÁLCULO AQUI: Quantidade * Valor Unitário
        // Isso ignora se o frontend mandou o p.valor_total errado
        const qtd = new Prisma.Decimal(p.quantidade || 0);
        const vUnit = new Prisma.Decimal(p.valor_unitario || 0);
        const totalItem = qtd.mul(vUnit);

        await tx.plano_corte_produto.create({
          data: {
            plano_corte_id: id,
            item_id: p.item_id,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: totalItem, // Salva o cálculo feito pelo servidor
            status: p.status,
          },
        });

        // Atualiza o histórico do item
        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: dto.data_venda ? new Date(dto.data_venda) : new Date(),
          },
        });
      }
    }

    // 2. RECALCULO DO CABEÇALHO (O PONTO CHAVE)
    // Buscamos o que está no banco agora para somar o total real
    const itensNoBanco = await tx.plano_corte_produto.findMany({
      where: { plano_corte_id: id },
    });

    const totalGeral = itensNoBanco.reduce(
      (acc, item) => acc.plus(new Prisma.Decimal(item.valor_total || 0)),
      new Prisma.Decimal(0),
    );

    // 3. ATUALIZA O CABEÇALHO SEMPRE
    await tx.plano_corte.update({
      where: { id },
      data: {
        fornecedor_id: dto.fornecedor_id,
        data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
        status: dto.status,
        valor_total: totalGeral, // Aqui o valor 1,74 vira 17,40 automaticamente
      },
    });

    // Retorna o plano atualizado com todas as relações
    return tx.plano_corte.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
    });
  });
}

async enviarParaProducao(id: number) {
  const planoId = Number(id)
  if (!planoId) throw new BadRequestException('ID inválido.')

  await this.findOne(planoId)

  return this.prisma.$transaction(async (tx) => {
    // 1) pipeline do plano
    await tx.plano_corte.update({
      where: { id: planoId },
      data: { status: 'EM_PRODUCAO' },
    })

const origem_tipo = 'PLANO_CORTE'
const origem_id = planoId
const agora = new Date()

const projeto = await tx.producao_projetos.upsert({
  where: {
    origem_tipo_origem_id: { origem_tipo, origem_id },
  },
  create: {
    codigo: `PROD-${randomUUID()}`,
    origem_tipo,
    origem_id,
    status: 'ABERTO',
    encaminhado_em: agora,
  },
  update: {
    status: 'ABERTO',
    encaminhado_em: agora,
  },
  select: { id: true, status: true, encaminhado_em: true },
})

return { ok: true, projeto_id: projeto.id }

  })
}


  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.$transaction(async (tx) => {
      // garante remoção sem depender de cascata
      await tx.plano_corte_consumo.deleteMany({ where: { plano_corte_id: id } })
      await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } })
      await tx.plano_corte.delete({ where: { id } })
      return { ok: true }
    })
  }
}
