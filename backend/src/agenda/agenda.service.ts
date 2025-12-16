import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AgendaProducao } from './agenda-producao.entity'

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(AgendaProducao)
    private repo: Repository<AgendaProducao>
  ) {}

  create(data: Partial<AgendaProducao>) {
    const agenda = this.repo.create(data)
    return this.repo.save(agenda)
  }

  findAll() {
    return this.repo.find({ order: { data: 'ASC' } })
  }
}
