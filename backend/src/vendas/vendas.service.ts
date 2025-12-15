import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Venda } from './entities/venda.entity'

@Injectable()
export class VendasService {
  constructor(
    @InjectRepository(Venda)
    private repo: Repository<Venda>
  ) {}

  create(data: Partial<Venda>) {
    return this.repo.save(this.repo.create(data))
  }

  findAll() {
    return this.repo.find({
      relations: ['ambientes', 'ambientes.itens'],
      order: { id: 'DESC' }
    })
  }

  findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: ['ambientes', 'ambientes.itens']
    })
  }

  update(id: number, data: Partial<Venda>) {
    return this.repo.update(id, data)
  }

  async remove(id: number) {
    await this.repo.delete(id)
    return { success: true }
  }
}
