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

async definirPermissoesDoUsuario(usuarioId: number, permissoesIds: number[]) {
  const usuario = await this.prisma.usuarios.findUnique({
    where: { id: usuarioId },
    select: { id: true },
  })
  if (!usuario) throw new NotFoundException('Usuário não encontrado')

  const ids = [...new Set((permissoesIds || []).map(Number).filter(Boolean))]

  const permissoes = await this.prisma.permissoes.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  })

  if (permissoes.length !== ids.length) {
    const encontradas = new Set(permissoes.map((p) => p.id))
    const faltando = ids.filter((id) => !encontradas.has(id))
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
async permissoesDoUsuarioPorId(usuarioId: number): Promise<string[]> {
  const rows = await this.prisma.usuarios_permissoes.findMany({
    where: { usuario_id: usuarioId },
    select: { permissao: { select: { chave: true } } },
  })

  return rows.map((r) => r.permissao.chave)
}

}
