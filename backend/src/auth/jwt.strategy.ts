import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PermissoesService } from '../permissoes/permissoes.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly permissoesService: PermissoesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const userId = Number(payload?.sub);
    if (!userId) throw new UnauthorizedException('Token inválido');

    const user = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        usuario: true,
        email: true,
        status: true,
        is_admin: true,
      },
    });

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
