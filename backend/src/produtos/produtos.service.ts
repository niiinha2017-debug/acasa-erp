import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Produto } from './produto.entity'

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private repo: Repository<Produto>
  ) {}

  create(data: Partial<Produto>) {
    const produto = this.repo.create(data)
    return this.repo.save(produto)
  }

  findAll() {
    return this.repo.find({
      order: { nome: 'ASC' }
    })
  }

  async findOne(id: number) {
    const produto = await this.repo.findOne({ where: { id } })

    if (!produto) {
      throw new NotFoundException('Produto não encontrado')
    }

    return produto
  }

  async update(id: number, data: Partial<Produto>) {
    const produto = await this.findOne(id)
    Object.assign(produto, data)
    return this.repo.save(produto)
  }

  async remove(id: number) {
    const produto = await this.findOne(id)
    return this.repo.remove(produto)
  }
}

