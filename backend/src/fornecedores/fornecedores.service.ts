import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Fornecedor } from './fornecedor.entity'

@Injectable()
export class FornecedoresService {
  constructor(
    @InjectRepository(Fornecedor)
    private repo: Repository<Fornecedor>
  ) {}

  create(data: Partial<Fornecedor>) {
    const fornecedor = this.repo.create(data)
    return this.repo.save(fornecedor)
  }

  findAll() {
    return this.repo.find({
      order: { nome_fantasia: 'ASC' }
    })
  }

  async findOne(id: number) {
    const fornecedor = await this.repo.findOne({ where: { id } })

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado')
    }

    return fornecedor
  }

  async update(id: number, data: Partial<Fornecedor>) {
    const fornecedor = await this.findOne(id)
    Object.assign(fornecedor, data)
    return this.repo.save(fornecedor)
  }

  async remove(id: number) {
    const fornecedor = await this.findOne(id)
    return this.repo.remove(fornecedor)
  }
}

