import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PermissoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPermissoes() {
    return this.prisma.permissoes.findMany({
      orderBy: { chave: 'asc' },
      select: { id: true, chave: true, descricao: true },
    })
  }

  async listarPermissoesDoUsuario(usuarioId: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    })
    if (!usuario) throw new NotFoundException('Usuário não encontrado')

    const vinculos = await this.prisma.usuarios_permissoes.findMany({
      where: { usuario_id: usuarioId },
      select: { permissao: { select: { chave: true } } },
      orderBy: { id: 'asc' },
    })

    return vinculos.map((v) => v.permissao.chave)
  }

  async definirPermissoesDoUsuario(usuarioId: number, chaves: string[]) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    })
    if (!usuario) throw new NotFoundException('Usuário não encontrado')

    const permissoes = await this.prisma.permissoes.findMany({
      where: { chave: { in: chaves } },
      select: { id: true, chave: true },
    })

    if (permissoes.length !== chaves.length) {
      const encontradas = new Set(permissoes.map((p) => p.chave))
      const faltando = chaves.filter((c) => !encontradas.has(c))
      throw new BadRequestException(`Permissões inválidas: ${faltando.join(', ')}`)
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuarios_permissoes.deleteMany({ where: { usuario_id: usuarioId } })
      if (permissoes.length) {
        await tx.usuarios_permissoes.createMany({
          data: permissoes.map((p) => ({
            usuario_id: usuarioId,
            permissao_id: p.id,
          })),
          skipDuplicates: true,
        })
      }
    })

    return { ok: true }
  }

  // helper pro login/me
  async permissoesDoUsuarioPorId(usuarioId: number) {
    const vinculos = await this.prisma.usuarios_permissoes.findMany({
      where: { usuario_id: usuarioId },
      select: { permissao: { select: { chave: true } } },
    })
    return vinculos.map((v) => v.permissao.chave)
  }
}
