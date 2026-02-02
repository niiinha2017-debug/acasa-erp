import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePlanoCorteDto } from '../dto/create-plano-corte.dto'
import { UpdatePlanoCorteDto } from '../dto/update-plano-corte.dto'

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
  await this.findOne(id)

  return this.prisma.$transaction(async (tx) => {
    // se veio produtos, refaz tudo
    if (dto.produtos) {
      const total = dto.produtos.reduce(
        (acc, p) => acc.plus(new Prisma.Decimal(p.valor_total || 0)),
        new Prisma.Decimal(0),
      )

      // atualiza cabeçalho
      await tx.plano_corte.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          status: dto.status,
          valor_total: total,
        },
      })

      // refaz linhas (permite duplicados)
      await tx.plano_corte_produto.deleteMany({ where: { plano_corte_id: id } })

      for (const p of dto.produtos) {
        await tx.plano_corte_produto.create({
          data: {
            plano_corte_id: id,
            item_id: p.item_id,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            valor_total: p.valor_total,
            status: p.status,
          },
        })

        await tx.plano_corte_item.update({
          where: { id: p.item_id },
          data: {
            ultimo_valor_vendido: p.valor_unitario,
            ultimo_vendido_em: dto.data_venda ? new Date(dto.data_venda) : new Date(),
          },
        })
      }
    } else {
      // update simples sem mexer nos produtos
      await tx.plano_corte.update({
        where: { id },
        data: {
          fornecedor_id: dto.fornecedor_id,
          data_venda: dto.data_venda ? new Date(dto.data_venda) : undefined,
          status: dto.status,
        },
      })
    }

    return tx.plano_corte.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        produtos: { include: { item: true } },
        consumos: { include: { produto: true } },
      },
    })
  })
}

async enviarParaProducao(
  id: number,
  payload: {
    inicio_em: string
    fim_em: string
    funcionario_ids: number[]
    titulo: string
    observacao?: string | null
  },
) {
  const planoId = Number(id)
  if (!planoId) throw new BadRequestException('ID inválido.')

  // valida datas do clique (EXATAS)
  const inicio = new Date(payload.inicio_em)
  const fim = new Date(payload.fim_em)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    throw new BadRequestException('inicio_em/fim_em inválidos.')
  }
if (fim.getTime() <= inicio.getTime()) {
  throw new BadRequestException('fim_em deve ser maior que inicio_em.')
}


  const funcIds = (payload.funcionario_ids || []).map(Number).filter((n) => n > 0)
  if (!funcIds.length) throw new BadRequestException('Selecione ao menos 1 funcionário.')
  const titulo = String(payload.titulo || '').trim()
  if (!titulo) throw new BadRequestException('titulo é obrigatório.')

  // garante plano existe
  const plano = await this.prisma.plano_corte.findUnique({
    where: { id: planoId },
    select: { id: true, status: true },
  })
  if (!plano) throw new NotFoundException(`Plano de Corte #${planoId} não encontrado.`)

  // custo total por funcionário (snapshot)
  const funcionarios = await this.prisma.funcionarios.findMany({
    where: { id: { in: funcIds } },
    select: { id: true, custo_hora: true },
  })
  if (!funcionarios.length) throw new BadRequestException('Funcionários inválidos.')

  const horas = (fim.getTime() - inicio.getTime()) / 36e5

  return this.prisma.$transaction(async (tx) => {
    // 1) muda o pipeline do plano de corte (imediato)
    await tx.plano_corte.update({
      where: { id: planoId },
      data: { status: 'EM_PRODUCAO' },
    })

    // 2) garante producao_projetos (idempotente sem depender do nome do @@unique)
    const origem_tipo = 'PLANO_CORTE'
    const origem_id = planoId

    const existente = await tx.producao_projetos.findFirst({
      where: { origem_tipo, origem_id },
      select: { id: true },
    })

    const projeto = existente
      ? await tx.producao_projetos.update({
          where: { id: existente.id },
          data: { status: 'ABERTO', encaminhado_em: new Date() },
          select: { id: true },
        })
      : await tx.producao_projetos.create({
          data: { origem_tipo, origem_id, status: 'ABERTO', encaminhado_em: new Date() },
          select: { id: true },
        })

    // 3) cria tarefas com horário EXATO do clique (uma por funcionário)
    await tx.producao_tarefas.createMany({
      data: funcionarios.map((f) => {
        const custoHora = Number(f.custo_hora || 0)
        const custoTotal = Number((custoHora * horas).toFixed(2))

        return {
          projeto_id: projeto.id,
          funcionario_id: f.id,
          titulo,
          status: 'PENDENTE',
          observacao: payload.observacao ? String(payload.observacao) : null,
          inicio_em: inicio, // ✅ EXATO do clique
          fim_em: fim,       // ✅ EXATO do clique
          custo_hora_aplicado: custoHora,
          custo_total: custoTotal,
        }
      }),
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
