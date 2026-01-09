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
      categoria: dto.categoria,
      chave: dto.chave,
      rotulo: dto.rotulo,
      tipo: dto.tipo,
      valor_texto: dto.valor_texto ?? null,
      valor_numero: dto.valor_numero ?? null,
      valor_booleano: dto.valor_booleano ?? null,
      valor_json: dto.valor_json ?? null,
      ordem: dto.ordem ?? 0,
      ativo: dto.ativo ?? true,
    },
  })
}


async atualizar(id: number, dto: AtualizarConstanteDto) {
  await this.buscarPorId(id)

  return this.prisma.constantes.update({
    where: { id },
    data: {
      categoria: dto.categoria,
      chave: dto.chave,
      rotulo: dto.rotulo,
      tipo: dto.tipo,
      valor_texto: dto.valor_texto === undefined ? undefined : dto.valor_texto,
      valor_numero: dto.valor_numero === undefined ? undefined : dto.valor_numero,
      valor_booleano: dto.valor_booleano === undefined ? undefined : dto.valor_booleano,
      valor_json: dto.valor_json === undefined ? undefined : dto.valor_json,
      ordem: dto.ordem,
      ativo: dto.ativo,
    },
  })
}

  async remover(id: number) {
    await this.buscarPorId(id)
    return this.prisma.constantes.delete({ where: { id } })
  }
}
