import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Despesa } from './despesa.entity'
import { LancamentoFinanceiro } from '../financeiro/lancamento-financeiro.entity'


@Injectable()
export class DespesasService {
  constructor(
    @InjectRepository(Despesa)
    private readonly repo: Repository<Despesa>,

    @InjectRepository(LancamentoFinanceiro)
    private readonly financeiroRepo: Repository<LancamentoFinanceiro>,
  ) {}

  async create(data: Partial<Despesa>) {
    // 🔥 backend NÃO decide status
    const despesa = this.repo.create(data)
    const saved = await this.repo.save(despesa)

    const lancamento = this.financeiroRepo.create({
      tipo: 'Pagar',
      origem: 'Despesa',
      descricao: saved.descricao,
      valor: saved.valor,
      data_vencimento: saved.data_vencimento,
      status: saved.status, // 🔥 vem da despesa
    })

    await this.financeiroRepo.save(lancamento)

    return saved
  }

  findAll() {
    return this.repo.find()
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } })
  }

  async update(id: number, data: Partial<Despesa>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async remove(id: number) {
    const result = await this.repo.delete(id)
    if (result.affected === 0) {
      throw new NotFoundException('Despesa não encontrada')
    }
    return { ok: true }
  }
}
