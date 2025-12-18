import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { PlanoCorte } from './plano-corte.entity'
import { ItemPlanoCorte } from './item-plano-corte.entity'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'
import { Produto } from '../produtos/produto.entity'

@Injectable()
export class PlanoCorteService {
  constructor(
    @InjectRepository(PlanoCorte)
    private readonly planoRepo: Repository<PlanoCorte>,

    @InjectRepository(ItemPlanoCorte)
    private readonly itemRepo: Repository<ItemPlanoCorte>,

    @InjectRepository(Produto)
    private readonly produtoRepo: Repository<Produto>,

    @InjectRepository(LancamentoFinanceiro)
    private readonly financeiroRepo: Repository<LancamentoFinanceiro>,
  ) {}

  /* =====================================================
     CRIAÇÃO DO PLANO (registro simples)
     ===================================================== */
  async create(data: any) {
    const plano = this.planoRepo.create({
      fornecedor_id: data.fornecedor_id,
      status: 'Registrado',
      data_prevista: data.data_prevista ?? null,
      valor_total: 0,
    })

    const savedPlano = await this.planoRepo.save(plano)

    let total = 0

    for (const item of data.itens) {
      const quantidade = Number(item.quantidade)
      const valorUnitario = Number(item.valor_unitario)
      const valorTotal = quantidade * valorUnitario

      total += valorTotal

      await this.itemRepo.save({
        plano_corte_id: savedPlano.id,
        nome: item.nome,
        cor: item.cor ?? null,
        unidade: item.unidade,
        quantidade,
        valor_unitario: valorUnitario,
        valor_total: valorTotal,
      })
    }

    savedPlano.valor_total = total
    await this.planoRepo.save(savedPlano)

    return savedPlano
  }

  /* =====================================================
     CONFIRMA PLANO → ENVIA PARA PRODUÇÃO + FINANCEIRO
     ===================================================== */
  async confirmarPlano(id: number, dataVencimento: Date) {
    const plano = await this.planoRepo.findOne({
      where: { id },
      relations: ['itens'],
    })

    if (!plano) {
      throw new NotFoundException('Plano de corte não encontrado')
    }

    // status claro e direto
    plano.status = 'Em Producao'
    await this.planoRepo.save(plano)

    // lançamento financeiro
    await this.financeiroRepo.save({
      tipo: 'Receber',
      origem: 'PlanoCorte',
      descricao: `Plano de corte #${plano.id}`,
      valor: plano.valor_total,
      data_vencimento: dataVencimento,
      fornecedor_id: plano.fornecedor_id,
      status: 'Pendente',
      plano_corte_id: plano.id,
    })

    // atualiza último valor vendido do produto
    for (const item of plano.itens) {
      await this.produtoRepo.update(
        {
          nome: item.nome,
          cor: item.cor,
        },
        {
          valor_unitario: item.valor_unitario,
        },
      )
    }

    return plano
  }

  /* =====================================================
     LISTAGEM
     ===================================================== */
  findAll() {
    return this.planoRepo.find({
      relations: ['itens'],
      order: { created_at: 'DESC' },
    })
  }

  findOne(id: number) {
    return this.planoRepo.find({
      where: { id },
      relations: ['itens'],
    })
  }
}
