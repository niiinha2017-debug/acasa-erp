import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
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
    return this.prisma.constantes.create({
      data: {
        ...dto, // O spread já pega categoria, chave, rotulo, etc.
        // Se o valor_numero vier, garantimos que o Prisma trate como Decimal se necessário
        valor_numero: dto.valor_numero ?? null,
        ordem: dto.ordem ?? 0,
        ativo: dto.ativo ?? true,
      },
    })
  }

  async atualizar(id: number, dto: AtualizarConstanteDto) {
    // Garante que o item existe antes de tentar mudar
    await this.buscarPorId(id)

    return this.prisma.constantes.update({
      where: { id },
      data: {
        ...dto,
        // Tratamos campos opcionais para não sobrescrever com null sem querer
        valor_texto: dto.valor_texto !== undefined ? dto.valor_texto : undefined,
        valor_numero: dto.valor_numero !== undefined ? dto.valor_numero : undefined,
      },
    })
  }

  async remover(id: number) {
    await this.buscarPorId(id)
    return this.prisma.constantes.delete({ where: { id } })
  }
}