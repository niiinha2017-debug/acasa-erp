import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'

@Injectable()
export class FuncionariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.funcionarios.findMany({
      orderBy: { id: 'desc' },
    })
  }

  async buscarPorId(id: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id },
    })

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.')
    }

    return funcionario
  }

  private normalizarDatas(
    dto: Partial<CriarFuncionarioDto | AtualizarFuncionarioDto>,
  ) {
    const data: any = { ...dto }

    // Datas ISO -> Date
    if (data.data_nascimento) data.data_nascimento = new Date(data.data_nascimento)
    if (data.admissao) data.admissao = new Date(data.admissao)
    if (data.demissao) data.demissao = new Date(data.demissao)
    if (data.data_pagamento) data.data_pagamento = new Date(data.data_pagamento)

    return data
  }

  async criar(dto: CriarFuncionarioDto) {
    try {
      return await this.prisma.funcionarios.create({
        data: this.normalizarDatas(dto),
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('CPF já cadastrado.')
      }
      throw e
    }
  }

  async atualizar(id: number, dto: AtualizarFuncionarioDto) {
    await this.buscarPorId(id)

    try {
      return await this.prisma.funcionarios.update({
        where: { id },
        data: this.normalizarDatas(dto),
      })
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('CPF já cadastrado.')
      }
      throw e
    }
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    await this.prisma.funcionarios.delete({ where: { id } })
    return { ok: true }
  }
}
