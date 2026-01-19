import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    })
  }

async validate(payload: any) {
  const usuarioId = Number(payload?.sub);

  const user = await this.prisma.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      usuario: true,
      nome: true,
      status: true,
      // O nome aqui deve ser 'permissoes', conforme definido no seu model usuarios
      permissoes: { 
        select: {
          permissao: { select: { chave: true } },
        },
      },
    },
  });

  if (!user) throw new UnauthorizedException('Usuário não encontrado');

  // Ajustado aqui também para user.permissoes
  const listaPermissoes = (user.permissoes || [])
    .map((up) => up?.permissao?.chave)
    .filter(Boolean);

  return {
    id: user.id,
    usuario: user.usuario,
    nome: user.nome,
    status: user.status,
    permissoes: listaPermissoes, 
  };
}
}
