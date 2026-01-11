import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarCompraDto } from './dto/criar-compra.dto'
import { AtualizarCompraDto } from './dto/atualizar-compra.dto'

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  // --- MÉTODOS AUXILIARES ---

  private num(n: any, field: string) {
    const v = Number(n)
    if (Number.isNaN(v)) throw new BadRequestException(`Número inválido: ${field}`)
    return v
  }

  private round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100
  }

  private calcTotalItens(
    itens?: Array<{ valor_total?: any; quantidade?: any; valor_unitario?: any }>,
  ) {
    if (!itens?.length) return 0
    let total = 0
    for (const it of itens) {
      const vt =
        it.valor_total !== undefined && it.valor_total !== null
          ? Number(it.valor_total)
          : Number(it.quantidade ?? 0) * Number(it.valor_unitario ?? 0)

      if (Number.isNaN(vt)) continue
      total += vt
    }
    return this.round2(total)
  }

  private validarRateios(
    rateios: Array<{ nome_ambiente: string; valor_alocado: any }>,
    total: number,
  ) {
    if (!rateios?.length) throw new BadRequestException('Rateio é obrigatório.')

    const nomes = rateios
      .map((r) => String(r.nome_ambiente || '').trim())
      .filter(Boolean)

    if (nomes.length !== rateios.length) {
      throw new BadRequestException('Rateio: nome_ambiente obrigatório em todas as linhas.')
    }

    const set = new Set(nomes.map((n) => n.toLowerCase()))
    if (set.size !== nomes.length) {
      throw new BadRequestException('Rateio: ambiente duplicado na mesma compra.')
    }

    const soma = this.round2(
      rateios.reduce((acc, r) => acc + Number(r.valor_alocado || 0), 0),
    )

    if (this.round2(total) !== soma) {
      throw new BadRequestException(
        `Rateio inválido: soma ${soma} deve ser igual ao total ${this.round2(total)}.`,
      )
    }
  }

// No ComprasService.ts
private async atualizarEstoqueEValorProdutos(
    itens: Array<{ produto_id?: number | null; quantidade: any; valor_unitario: any }>,
  ) {
    if (!itens?.length) return;

    for (const it of itens) {
      if (!it.produto_id) continue;

const valorUnit = this.num(it.valor_unitario ?? 0, 'item.valor_unitario');
const qtdComprada = this.num(it.quantidade ?? 0, 'item.quantidade');

      await this.prisma.produtos.update({
        where: { id: it.produto_id },
        data: {
          valor_unitario: valorUnit,
          quantidade: {
            increment: qtdComprada,
          },
          atualizado_em: new Date(),
        },
      });
    }
  }
  // --- MÉTODOS PRINCIPAIS ---

  async listar(filtros: { venda_id?: number; tipo_compra?: string }) {
    const where: any = {}
    if (filtros.venda_id) where.venda_id = filtros.venda_id
    if (filtros.tipo_compra) where.tipo_compra = filtros.tipo_compra

    return this.prisma.compras.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true, cnpj: true },
        },
        itens: true,
        rateios: true,
      },
    })
  }

  async buscarPorId(id: number) {
    const compra = await this.prisma.compras.findUnique({
      where: { id },
      include: {
        fornecedor: {
          select: { id: true, razao_social: true, nome_fantasia: true, cnpj: true },
        },
        itens: true,
        rateios: true,
        venda: { select: { id: true, cliente_id: true, status: true, data_venda: true } },
      },
    })
    if (!compra) throw new NotFoundException('Compra não encontrada')
    return compra
  }

  async criar(dto: CriarCompraDto) {
    const tipo = String((dto as any).tipo_compra || '').trim()
    const total = this.calcTotalItens((dto as any).itens)

    // Validações de Regra de Negócio
    if (tipo === 'CLIENTE_AMBIENTE') {
      if (!(dto as any).venda_id) throw new BadRequestException('venda_id é obrigatório para CLIENTE_AMBIENTE.')
      this.validarRateios((dto as any).rateios, total)
    } else if (tipo === 'INSUMOS') {
      if ((dto as any).rateios?.length) throw new BadRequestException('Insumos não permitem rateio.')
    } else {
      throw new BadRequestException('tipo_compra inválido.')
    }

    // Preparar Itens com snapshot dos dados do produto
    const itensParaCriar = []
    if ((dto as any).itens?.length) {
      for (const i of (dto as any).itens) {
        let dadosProd: any = { nome_produto: 'Item Avulso' } // Fallback se não tiver produto_id
        
        if (i.produto_id) {
          const p = await this.prisma.produtos.findUnique({ where: { id: i.produto_id } })
          if (p) {
            dadosProd = {
              nome_produto: p.nome_produto,
              marca: p.marca,
              cor: p.cor,
              medida: p.medida,
              unidade: i.unidade || p.unidade || '',
            }
          }
        }

        const quantidade = this.round2(this.num(i.quantidade ?? 1, 'itens.quantidade'))
        const valorUnit = this.round2(this.num(i.valor_unitario ?? 0, 'itens.valor_unitario'))
        const valorTotal = i.valor_total !== undefined 
          ? this.round2(this.num(i.valor_total, 'itens.valor_total')) 
          : this.round2(quantidade * valorUnit)

        itensParaCriar.push({
          produto_id: i.produto_id ?? null,
          ...dadosProd,
          quantidade,
          valor_unitario: valorUnit,
          valor_total: valorTotal,
        })
      }
    }

    const compra = await this.prisma.compras.create({
      data: {
        tipo_compra: tipo,
        venda_id: tipo === 'CLIENTE_AMBIENTE' ? (dto as any).venda_id : null,
        data_compra: (dto as any).data_compra ? new Date((dto as any).data_compra) : undefined,
        fornecedor_id: (dto as any).fornecedor_id,
        venda_item_id: (dto as any).venda_item_id ?? null,
        status: (dto as any).status,
        valor_total: total,
        itens: { create: itensParaCriar },
        rateios: tipo === 'CLIENTE_AMBIENTE' ? {
          create: (dto as any).rateios.map((r: any) => ({
            nome_ambiente: String(r.nome_ambiente).trim(),
            valor_alocado: this.round2(this.num(r.valor_alocado, 'rateios.valor_alocado')),
          })),
        } : undefined,
      },
      include: { itens: true, rateios: true },
    })

    await this.atualizarEstoqueEValorProdutos(compra.itens as any)
    return compra
  }

  async atualizar(id: number, dto: AtualizarCompraDto) {
    const existe = await this.prisma.compras.findUnique({
      where: { id },
      include: { itens: true, rateios: true },
    })
    if (!existe) throw new NotFoundException('Compra não encontrada')

    const tipoAtual = String(existe.tipo_compra || '').trim()
    
    // 1. Remover itens solicitados
    if ((dto as any).itens_remover_ids?.length) {
      await this.prisma.compras_itens.deleteMany({
        where: { id: { in: (dto as any).itens_remover_ids }, compra_id: id },
      })
    }

    // 2. Upsert de itens buscando dados dos produtos
    if ((dto as any).itens?.length) {
      for (const item of (dto as any).itens) {
        let dadosProd: any = {}
        if (item.produto_id) {
          const p = await this.prisma.produtos.findUnique({ where: { id: item.produto_id } })
          if (p) {
            dadosProd = {
              nome_produto: p.nome_produto,
              marca: p.marca,
              cor: p.cor,
              medida: p.medida,
              unidade: item.unidade || p.unidade || '',
            }
          }
        }

        const quantidade = this.round2(this.num(item.quantidade ?? 1, 'itens.quantidade'))
        const valorUnit = this.round2(this.num(item.valor_unitario ?? 0, 'itens.valor_unitario'))
        const valorTotal = item.valor_total !== undefined 
          ? this.round2(this.num(item.valor_total, '')) 
          : this.round2(quantidade * valorUnit)

        const payloadItem = {
          produto_id: item.produto_id ?? null,
          ...dadosProd,
          quantidade,
          valor_unitario: valorUnit,
          valor_total: valorTotal,
        }

        if (item.id) {
          await this.prisma.compras_itens.update({ where: { id: item.id }, data: payloadItem })
        } else {
          await this.prisma.compras_itens.create({ data: { ...payloadItem, compra_id: id } })
        }
      }
    }

    // 3. Recalcular total e validar rateios
    const itensAtualizados = await this.prisma.compras_itens.findMany({ where: { compra_id: id } })
    const total = this.calcTotalItens(itensAtualizados as any)

    if (tipoAtual === 'CLIENTE_AMBIENTE') {
      const rateiosInput = (dto as any).rateios
      if (rateiosInput) {
        this.validarRateios(rateiosInput, total)
        await this.prisma.compras_rateio.deleteMany({ where: { compra_id: id } })
        await this.prisma.compras_rateio.createMany({
          data: rateiosInput.map((r: any) => ({
            compra_id: id,
            nome_ambiente: String(r.nome_ambiente).trim(),
            valor_alocado: this.round2(this.num(r.valor_alocado, 'rateios.valor_alocado')),
          })),
        })
      } else {
        const rateiosAtuais = await this.prisma.compras_rateio.findMany({ where: { compra_id: id } })
        this.validarRateios(rateiosAtuais as any, total)
      }
    }

    // 4. Update final da compra
    const compraAtualizada = await this.prisma.compras.update({
      where: { id },
      data: {
        fornecedor_id: (dto as any).fornecedor_id ?? undefined,
        status: (dto as any).status ?? undefined,
        data_compra: (dto as any).data_compra ? new Date((dto as any).data_compra) : undefined,
        valor_total: total,
        venda_id: tipoAtual === 'CLIENTE_AMBIENTE' ? ((dto as any).venda_id ?? undefined) : null,
      },
      include: { itens: true, rateios: true },
    })

    await this.atualizarUltimoValorProdutos(itensAtualizados as any)
    return compraAtualizada
  }

  async remover(id: number) {
    const existe = await this.prisma.compras.findUnique({ where: { id } })
    if (!existe) throw new NotFoundException('Compra não encontrada')
    await this.prisma.compras.delete({ where: { id } })
    return { ok: true }
  }
}