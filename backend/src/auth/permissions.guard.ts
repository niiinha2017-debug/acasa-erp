import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const raw =
      this.reflector.get<any>('permissoes', context.getHandler()) ||
      this.reflector.get<any>('permissoes', context.getClass());

    const required: string[] = Array.isArray(raw)
      ? raw
      : raw
        ? [String(raw)]
        : [];

    // rota sem permissão -> libera
    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // ✅ sem user (token ausente/invalidado) -> 401
    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }

    // 🔒 status (admin pode operar mesmo pendente)
    if (user?.is_admin) return true;
    if (user.status !== 'ATIVO') {
      throw new ForbiddenException('Acesso negado: sua conta não está ativa.');
    }

    const userPerms: string[] = Array.isArray(user?.permissoes)
      ? user.permissoes
      : [];
    if (userPerms.includes('ADMIN')) return true;
    const ok = required.some((p) => userPerms.includes(p));

    if (!ok)
      throw new ForbiddenException(
        'Você não tem permissão para realizar esta ação.',
      );

    return true;
  }
}
