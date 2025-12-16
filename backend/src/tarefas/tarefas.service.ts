import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Tarefa } from './tarefa.entity'

@Injectable()
export class TarefasService {
  constructor(
    @InjectRepository(Tarefa)
    private repo: Repository<Tarefa>
  ) {}

  create(data: Partial<Tarefa>) {
    const tarefa = this.repo.create(data)
    return this.repo.save(tarefa)
  }

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } })
  }

  async findOne(id: number) {
    const tarefa = await this.repo.findOne({ where: { id } })
    if (!tarefa) throw new NotFoundException('Tarefa não encontrada')
    return tarefa
  }

  async update(id: number, data: Partial<Tarefa>) {
    await this.repo.update(id, data)
    return this.findOne(id)
  }

  async remove(id: number) {
    const result = await this.repo.delete(id)
    if (!result.affected) {
      throw new NotFoundException('Tarefa não encontrada')
    }
    return { ok: true }
  }
}
