import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LancamentoFinanceiro } from './lancamento-financeiro.entity'

@Injectable()
export class FinanceiroService {
  constructor(
    @InjectRepository(LancamentoFinanceiro)
    private repo: Repository<LancamentoFinanceiro>
  ) {}

  create(data: Partial<LancamentoFinanceiro>) {
    const lancamento = this.repo.create(data)
    return this.repo.save(lancamento)
  }

  findAll() {
    return this.repo.find({ order: { data_vencimento: 'ASC' } })
  }

  findByTipo(tipo: 'Pagar' | 'Receber') {
    return this.repo.find({ where: { tipo } })
  }
}
