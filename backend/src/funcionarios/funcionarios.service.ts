import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Funcionario } from './funcionario.entity'

@Injectable()
export class FuncionariosService {
  constructor(
    @InjectRepository(Funcionario)
    private repo: Repository<Funcionario>
  ) {}

  create(data: Partial<Funcionario>) {
    const funcionario = this.repo.create(data)
    return this.repo.save(funcionario)
  }

  findAll() {
    return this.repo.find({
      order: { nome: 'ASC' }
    })
  }

  async findOne(id: number) {
    const funcionario = await this.repo.findOne({ where: { id } })
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado')
    }
    return funcionario
  }

  async update(id: number, data: Partial<Funcionario>) {
    const funcionario = await this.findOne(id)
    Object.assign(funcionario, data)
    return this.repo.save(funcionario)
  }

  async remove(id: number) {
    const funcionario = await this.findOne(id)
    return this.repo.remove(funcionario)
  }
}
