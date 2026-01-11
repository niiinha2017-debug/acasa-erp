import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePlanoCorteItemDto } from './dto/create-plano-corte-iten.dto'
import { UpdatePlanoCorteItemDto } from './dto/update-plano-corte-iten.dto'

@Injectable()
export class PlanoCorteItensService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CRIAR item de plano de corte
   * (usado pelo modal "Novo Produto")
   */
  create(dto: CreatePlanoCorteItemDto) {
    return this.prisma.plano_corte_item.create({
      data: {
        fornecedor_id: dto.fornecedor_id,
        nome_produto: dto.nome_produto,
        marca: dto.marca,
        cor: dto.cor,
        medida: dto.medida,
        unidade: dto.unidade,
        quantidade: dto.quantidade,
        valor_unitario: dto.valor_unitario,
        valor_total: dto.valor_total,
        status: dto.status,
      },
    })
  }

  /**
   * LISTAR itens por fornecedor
   * (usado no SearchInput de Produto)
   */
  findAll(fornecedor_id?: number) {
    return this.prisma.plano_corte_item.findMany({
      where: fornecedor_id ? { fornecedor_id } : {},
      orderBy: { nome_produto: 'asc' },
    })
  }

  /**
   * ATUALIZAR item
   */
  update(id: number, dto: UpdatePlanoCorteItemDto) {
    return this.prisma.plano_corte_item.update({
      where: { id },
      data: {
        fornecedor_id: dto.fornecedor_id,
        nome_produto: dto.nome_produto,
        marca: dto.marca,
        cor: dto.cor,
        medida: dto.medida,
        unidade: dto.unidade,
        quantidade: dto.quantidade,
        valor_unitario: dto.valor_unitario,
        valor_total: dto.valor_total,
        status: dto.status,
      },
    })
  }

  /**
   * REMOVER item
   */
  remove(id: number) {
    return this.prisma.plano_corte_item.delete({
      where: { id },
    })
  }
}
