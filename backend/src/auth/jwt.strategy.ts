import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PermissoesService } from '../permissoes/permissoes.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly permissoesService: PermissoesService,
  ) {
    const jwtSecret =
      config.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'acasa_dev_secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const userId = Number(payload?.sub);
    if (!userId) throw new UnauthorizedException('Token inválido');

    let user: any = null;
    try {
      user = await this.prisma.usuarios.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nome: true,
          usuario: true,
          email: true,
          status: true,
          is_admin: true,
          funcionario_id: true,
          funcionario: {
            select: {
              setor: true,
              unidade: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientValidationError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        error instanceof Prisma.PrismaClientUnknownRequestError
      ) {
        throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
      }
      throw error;
    }

    if (!user) throw new UnauthorizedException('Usuário inválido');

    if (user.status === 'INATIVO') {
      throw new UnauthorizedException('Sua conta está desativada.');
    }

    let permissoes: string[] = [];
    try {
      permissoes =
        await this.permissoesService.permissoesDoUsuarioPorId(userId);
    } catch {
      permissoes = [];
    }

    // vira req.user
    return { ...user, permissoes };
  }
}
