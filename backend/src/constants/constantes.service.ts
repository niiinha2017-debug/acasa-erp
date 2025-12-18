import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Constante } from './constantes.entity'

@Injectable()
export class ConstantesService {
  constructor(
    @InjectRepository(Constante)
    private repo: Repository<Constante>,
  ) {}

  find(grupo?: string, ativo?: boolean) {
    const where: any = {}

    if (grupo) where.grupo = grupo
    if (ativo !== undefined) where.ativo = ativo

    return this.repo.find({
      where,
      order: { label: 'ASC' },
    })
  }

  create(data: Partial<Constante>) {
    const entity = this.repo.create({
      ...data,
      ativo: data.ativo ?? true, // boolean
    })

    return this.repo.save(entity)
  }

  async update(id: number, data: Partial<Constante>) {
    await this.repo.update(id, {
      ...data,
      ativo: data.ativo ?? true, // boolean
    })

    return this.repo.findOne({ where: { id } })
  }

  async remove(id: number) {
    return this.repo.delete(id)
  }
}
