import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Produto } from './produto.entity'

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private repo: Repository<Produto>
  ) {}

  // 🔒 REGRA: não permitir produto duplicado
private async findProdutoDuplicado(data: Partial<Produto>) {
  const where: any = {
    nome: data.nome
  }

  if (data.fornecedor !== undefined) {
    where.fornecedor = data.fornecedor
  }

  if (data.medida !== undefined) {
    where.medida = data.medida
  }

  if (data.cor !== undefined) {
    where.cor = data.cor
  }

  return this.repo.findOne({ where })
}


  // CREATE
  async create(data: Partial<Produto>) {
    if (!data.nome || !data.fornecedor) {
      throw new BadRequestException('Fornecedor e nome são obrigatórios')
    }

    const duplicado = await this.findProdutoDuplicado(data)

    if (duplicado) {
      // produto já existe → retorna ele para edição
      return duplicado
      // se preferir bloquear, troque por:
      // throw new BadRequestException('Produto já cadastrado')
    }

    const produto = this.repo.create(data)
    return this.repo.save(produto)
  }

  // LIST
  findAll() {
    return this.repo.find({
      order: { nome: 'ASC' }
    })
  }

  // GET ONE
  async findOne(id: number) {
    const produto = await this.repo.findOne({
      where: { id }
    })

    if (!produto) {
      throw new NotFoundException('Produto não encontrado')
    }

    return produto
  }

  // UPDATE
  async update(id: number, data: Partial<Produto>) {
    const produto = await this.findOne(id)

    const duplicado = await this.repo.findOne({
      where: {
        fornecedor: data.fornecedor ?? produto.fornecedor,
        nome: data.nome ?? produto.nome,
        medida: data.medida ?? produto.medida,
        cor: data.cor ?? produto.cor
      }
    })

    if (duplicado && duplicado.id !== id) {
      throw new BadRequestException(
        'Já existe outro produto com essas características'
      )
    }

    Object.assign(produto, data)
    return this.repo.save(produto)
  }

  // DELETE
  async remove(id: number) {
    const produto = await this.findOne(id)
    return this.repo.remove(produto)
  }
}
