import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PlanoCorte } from './plano-corte.entity'
import { ItemPlanoCorte } from './item-plano-corte.entity'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'

@Injectable()
export class PlanoCorteService {
constructor(
  @InjectRepository(PlanoCorte)
  private planoRepo: Repository<PlanoCorte>,

  @InjectRepository(ItemPlanoCorte)
  private itemRepo: Repository<ItemPlanoCorte>,

  @InjectRepository(LancamentoFinanceiro) // 👈 AQUI
  private financeiroRepo: Repository<LancamentoFinanceiro>,
) {}


  async create(data: any) {
    const plano = this.planoRepo.create({
      fornecedor_id: data.fornecedor_id,
      descricao: data.descricao,
      status: 'Rascunho'
    })

    const savedPlano = await this.planoRepo.save(plano)

    let total = 0

    for (const item of data.itens) {
      const valorTotal = item.quantidade * item.valor_unitario
      total += valorTotal

      await this.itemRepo.save({
        ...item,
        plano_corte_id: savedPlano.id,
        valor_total: valorTotal
      })
    }

    savedPlano.valor_total = total
    await this.planoRepo.save(savedPlano)

    // 💰 FINANCEIRO AUTOMÁTICO
    await this.financeiroRepo.save({
      tipo: 'Receber',
      origem: 'PlanoCorte',
      descricao: `Plano de corte #${savedPlano.id}`,
      valor: total,
      data_vencimento: data.data_vencimento,
      fornecedor_id: savedPlano.fornecedor_id,
      status: 'Pendente',
      plano_corte_id: savedPlano.id
    })

    return savedPlano
  }

  findAll() {
    return this.planoRepo.find({
      relations: ['itens'],
      order: { created_at: 'DESC' }
    })
  }

  findOne(id: number) {
    return this.planoRepo.findOne({
      where: { id },
      relations: ['itens']
    })
  }
}
