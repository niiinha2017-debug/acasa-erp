import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { PermissoesService } from '../permissoes/permissoes.service'

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
    })
  }

  async validate(payload: any) {
    const userId = Number(payload?.sub)
    if (!userId) throw new UnauthorizedException('Token inválido')

    const user = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, usuario: true, email: true, status: true },
    })

    if (!user || user.status !== 'ATIVO') {
      throw new UnauthorizedException('Usuário inválido')
    }

    const permissoes = await this.permissoesService.permissoesDoUsuarioPorId(userId)

    // ISSO vira req.user
    return {
      ...user,
      permissoes, // ✅ agora o PermissionsGuard funciona
    }
  }
}
