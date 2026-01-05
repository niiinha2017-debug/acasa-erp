import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class RecuperacaoSenhaService {
  constructor(private readonly prisma: PrismaService) {}

  async solicitar(email: string) {
    const user = await this.prisma.usuarios.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado para este email');
    }

    const token = randomBytes(32).toString('hex');

    await this.prisma.recuperacao_senha.create({
      data: {
        usuario_id: user.id,
        email: user.email,
        token,
        utilizado: false,
      },
    });

    // Por enquanto retorna token para teste (sem email)
    return { ok: true, token };
  }

  async confirmar(token: string, senha_nova: string) {
    const pedido = await this.prisma.recuperacao_senha.findFirst({
      where: {
        token,
        utilizado: false,
      },
      orderBy: { criado_em: 'desc' },
    });

    if (!pedido) {
      throw new BadRequestException('Token inválido ou já utilizado');
    }

    const user = await this.prisma.usuarios.findUnique({
      where: { id: pedido.usuario_id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const senhaNovaHash = await bcrypt.hash(senha_nova, 10);

    // Atualiza senha do usuário e marca pedido como utilizado
    await this.prisma.$transaction([
      this.prisma.usuarios.update({
        where: { id: user.id },
        data: { senha: senhaNovaHash },
      }),
      this.prisma.recuperacao_senha.update({
        where: { id: pedido.id },
        data: {
          utilizado: true,
          // guarda auditoria no registro (hashes, não senha em texto)
          senha_antiga: user.senha,
          senha_nova: senhaNovaHash,
        },
      }),
    ]);

    return { ok: true };
  }
}
