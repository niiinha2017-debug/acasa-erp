import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissoesService {
  constructor(private readonly prisma: PrismaService) {}

  private async listarTodasAsChaves(): Promise<string[]> {
    const rows = await this.prisma.permissoes.findMany({
      select: { chave: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.chave);
  }

  async listarPermissoes() {
    return this.prisma.permissoes.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, chave: true, descricao: true },
    });
  }

  async listarPermissoesDoUsuario(usuarioId: number) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { id: true, is_admin: true },
    });
    if (!usuario) throw new NotFoundException('Usuario nao encontrado');

    if (usuario.is_admin) {
      return this.listarTodasAsChaves();
    }

    const vinculos = await this.prisma.usuarios_permissoes.findMany({
      where: { usuario_id: usuarioId },
      select: { permissao: { select: { chave: true } } },
      orderBy: { id: 'asc' },
    });
    const chaves = vinculos.map((v) => v.permissao.chave);
    if (chaves.includes('ADMIN')) {
      return this.listarTodasAsChaves();
    }
    return chaves;
  }

  async definirPermissoesDoUsuario(usuarioId: number, permissoesIds: number[]) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });
    if (!usuario) throw new NotFoundException('Usuario nao encontrado');

    const ids = [...new Set((permissoesIds || []).map(Number).filter(Boolean))];

    const permissoes = await this.prisma.permissoes.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (permissoes.length !== ids.length) {
      const encontradas = new Set(permissoes.map((p) => p.id));
      const faltando = ids.filter((id) => !encontradas.has(id));
      throw new BadRequestException(
        `Permissoes invalidas: ${faltando.join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuarios_permissoes.deleteMany({
        where: { usuario_id: usuarioId },
      });

      if (permissoes.length) {
        await tx.usuarios_permissoes.createMany({
          data: permissoes.map((p) => ({
            usuario_id: usuarioId,
            permissao_id: p.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    return { ok: true };
  }

  // helper para login/me
  async permissoesDoUsuarioPorId(usuarioId: number): Promise<string[]> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { is_admin: true },
    });

    if (usuario?.is_admin) {
      return this.listarTodasAsChaves();
    }

    const rows = await this.prisma.usuarios_permissoes.findMany({
      where: { usuario_id: usuarioId },
      select: { permissao: { select: { chave: true } } },
    });
    const chaves = rows.map((r) => r.permissao.chave);
    if (chaves.includes('ADMIN')) {
      return this.listarTodasAsChaves();
    }
    return chaves;
  }
}
