import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service'
import { CriarConstanteDto } from './dto/criar-constante.dto'
import { AtualizarConstanteDto } from './dto/atualizar-constante.dto'

@Injectable()
export class ConstantesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(params: { categoria?: string; ativas?: boolean }) {
    const { categoria, ativas } = params

    return this.prisma.constantes.findMany({
      where: {
        ...(categoria ? { categoria } : {}),
        ...(typeof ativas === 'boolean' ? { ativo: ativas } : {}),
      },
      // Mantive sua ordenação que está excelente para relatórios
      orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }, { rotulo: 'asc' }],
    })
  }

  async buscarPorId(id: number) {
    const item = await this.prisma.constantes.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Constante não encontrada')
    return item
  }

async criar(dto: CriarConstanteDto) {
    try {
      return await this.prisma.constantes.create({
        data: {
          categoria: dto.categoria,
          chave: dto.chave,
          rotulo: dto.rotulo,
          valor_texto: dto.valor_texto || null,
          // Converte o número para Decimal do Prisma (resolve erro 500)
          valor_numero: dto.valor_numero ? new Prisma.Decimal(dto.valor_numero) : null,
          ordem: Number(dto.ordem) || 0,
          ativo: dto.ativo ?? true,
        },
      })
    } catch (error) {
      console.error('Erro ao criar constante:', error)
      throw new BadRequestException('Erro ao salvar no banco. Verifique os campos.')
    }
  }

  async atualizar(id: number, dto: AtualizarConstanteDto) {
    await this.buscarPorId(id)

    try {
      return await this.prisma.constantes.update({
        where: { id },
        data: {
          categoria: dto.categoria,
          chave: dto.chave,
          rotulo: dto.rotulo,
          valor_texto: dto.valor_texto !== undefined ? dto.valor_texto : undefined,
          // Converte com segurança
          valor_numero: dto.valor_numero !== undefined 
            ? (dto.valor_numero ? new Prisma.Decimal(dto.valor_numero) : null) 
            : undefined,
          ordem: dto.ordem !== undefined ? Number(dto.ordem) : undefined,
          ativo: dto.ativo !== undefined ? dto.ativo : undefined,
        },
      })
    } catch (error) {
      console.error('Erro ao atualizar constante:', error)
      throw new BadRequestException('Erro ao atualizar no banco.')
    }
  }
  async remover(id: number) {
    await this.buscarPorId(id)
    return this.prisma.constantes.delete({ where: { id } })
  }
}