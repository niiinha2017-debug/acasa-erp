// src/auth/permission.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se o usuário for 'admin', ele pula a verificação de permissão e entra direto
    if (user?.role === 'admin') {
      return true;
    }

    // Caso contrário, verifica se ele tem a permissão específica
    if (!user?.permissions?.includes(requiredPermission)) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }

    return true;
  }
}

