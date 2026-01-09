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

private normalizarDatas(dto: any) {
  const data = { ...dto };

  // Lista de campos que são Datas no Banco
  const camposData = ['data_nascimento', 'admissao', 'demissao', 'data_pagamento'];

  camposData.forEach(campo => {
    if (data[campo]) {
      // Se tiver valor, converte para Date
      data[campo] = new Date(data[campo]);
    } else {
      // Se vier "" ou undefined, força ser NULL para o Prisma não reclamar
      data[campo] = null;
    }
  });

  return data;
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
