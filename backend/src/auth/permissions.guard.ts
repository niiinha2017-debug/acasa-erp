import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHAVE_ADMIN } from '../permissoes/permissoes.service';

/**
 * Guard que exige as permissões declaradas com @Permissoes() na rota.
 * Regras: sem user → 401; is_admin ou permissão ADMIN → libera; senão exige uma das permissões da rota.
 */
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

    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }

    if (user?.is_admin) return true;
    if (user.status !== 'ATIVO') {
      throw new ForbiddenException('Acesso negado: sua conta não está ativa.');
    }

    const userPerms: string[] = Array.isArray(user?.permissoes)
      ? user.permissoes
      : [];
    if (userPerms.includes(CHAVE_ADMIN)) return true;
    const ok = required.some((p) => userPerms.includes(p));

    if (!ok)
      throw new ForbiddenException(
        'Você não tem permissão para realizar esta ação.',
      );

    return true;
  }
}
