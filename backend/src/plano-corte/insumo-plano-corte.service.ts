import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InsumoPlanoCorte } from './insumo-plano-corte.entity'

@Injectable()
export class InsumoPlanoCorteService {
  constructor(
    @InjectRepository(InsumoPlanoCorte)
    private readonly repo: Repository<InsumoPlanoCorte>
  ) {}

  async criar(data: Partial<InsumoPlanoCorte>) {
    const insumo = this.repo.create({
      ...data,
      custo_total: Number(data.quantidade) * Number(data.custo_unitario)
    })

    return this.repo.save(insumo)
  }

  listarPorPlano(plano_corte_id: number) {
    return this.repo.find({
      where: { plano_corte_id }
    })
  }

  async remover(id: number) {
    return this.repo.delete(id)
  }
}
