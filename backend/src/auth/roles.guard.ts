import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Pega os setores permitidos que você definiu na etiqueta @Roles()
    const rolesRequeridas = this.reflector.get<string[]>('roles', context.getHandler());
    
    // Se a rota não tiver a etiqueta @Roles, ela é liberada para qualquer um logado
    if (!rolesRequeridas) {
      return true;
    }

    // 2. Pega o usuário que foi validado pelo JwtAuthGuard (Strategy)
    const { user } = context.switchToHttp().getRequest();

    // 3. Verifica se o setor do usuário (vindo do Token) está na lista permitida
    return rolesRequeridas.includes(user.setor);
  }
}