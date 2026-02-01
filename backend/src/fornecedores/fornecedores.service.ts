import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFornecedorDto } from './dto/criar-fornecedor.dto'
import { UpdateFornecedorDto } from './dto/atualizar-fornecedor.dto'

@Injectable()
export class FornecedorService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.fornecedor.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        razao_social: true,
        nome_fantasia: true,
        cnpj: true,
        ie: true,
        telefone: true,
        whatsapp: true,
        email: true,
        cep: true,
        endereco: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        forma_pagamento: true,
        data_vencimento: true,
        criado_em: true,
        atualizado_em: true,
      },
    })
  }

  async buscarPorId(id: number) {
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id },
      select: {
        id: true,
        razao_social: true,
        nome_fantasia: true,
        cnpj: true,
        ie: true,
        telefone: true,
        whatsapp: true,
        email: true,
        cep: true,
        endereco: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        forma_pagamento: true,
        data_vencimento: true,
        criado_em: true,
        atualizado_em: true,
      },
    })

    if (!fornecedor) throw new NotFoundException('Fornecedor não encontrado.')
    return fornecedor
  }

  async criar(dto: CreateFornecedorDto) {
    try {
      return await this.prisma.fornecedor.create({
        data: {
          razao_social: dto.razao_social,
          nome_fantasia: dto.nome_fantasia,
          cnpj: dto.cnpj,
          ie: dto.ie ?? null,
          telefone: dto.telefone ?? null,
          whatsapp: dto.whatsapp ?? null,
          email: dto.email ?? null,
          cep: dto.cep ?? null,
          endereco: dto.endereco ?? null,
          numero: dto.numero ?? null,
          bairro: dto.bairro ?? null,
          cidade: dto.cidade ?? null,
          estado: dto.estado ?? null,
          forma_pagamento: dto.forma_pagamento ?? null,
          data_vencimento: dto.data_vencimento ?? null,
        },
        select: {
          id: true,
          razao_social: true,
          nome_fantasia: true,
          cnpj: true,
          ie: true,
          telefone: true,
          whatsapp: true,
          email: true,
          cep: true,
          endereco: true,
          numero: true,
          bairro: true,
          cidade: true,
          estado: true,
          forma_pagamento: true,
          data_vencimento: true,
          criado_em: true,
          atualizado_em: true,
        },
      })
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('CNPJ já cadastrado.')
      }
      throw e
    }
  }

  async select(q?: string) {
  const termo = String(q || '').trim()

  const rows = await this.prisma.fornecedor.findMany({
    where: termo
      ? {
          OR: [
            { razao_social: { contains: termo } },
            { nome_fantasia: { contains: termo } },
            { cnpj: { contains: termo } },
          ],
        }
      : undefined,
    select: { id: true, razao_social: true, nome_fantasia: true, cnpj: true },
    orderBy: { razao_social: 'asc' },
    take: 50,
  })

  return rows.map((f) => ({
    value: f.id,
    label: f.nome_fantasia || f.razao_social || `ID #${f.id}`,
  }))
}


  async atualizar(id: number, dto: UpdateFornecedorDto) {
    await this.buscarPorId(id)

    try {
      return await this.prisma.fornecedor.update({
        where: { id },
        data: {
          razao_social: dto.razao_social,
          nome_fantasia: dto.nome_fantasia,
          cnpj: dto.cnpj,
          ie: dto.ie,
          telefone: dto.telefone,
          whatsapp: dto.whatsapp,
          email: dto.email,
          cep: dto.cep,
          endereco: dto.endereco,
          numero: dto.numero,
          bairro: dto.bairro,
          cidade: dto.cidade,
          estado: dto.estado,
          forma_pagamento: dto.forma_pagamento,
          data_vencimento: dto.data_vencimento,
        },
        select: {
          id: true,
          razao_social: true,
          nome_fantasia: true,
          cnpj: true,
          ie: true,
          telefone: true,
          whatsapp: true,
          email: true,
          cep: true,
          endereco: true,
          numero: true,
          bairro: true,
          cidade: true,
          estado: true,
          forma_pagamento: true,
          data_vencimento: true,
          criado_em: true,
          atualizado_em: true,
        },
      })
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('CNPJ já cadastrado.')
      }
      throw e
    }
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    await this.prisma.fornecedor.delete({ where: { id } })
    return { ok: true }
  }
}
