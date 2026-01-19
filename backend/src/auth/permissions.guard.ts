import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissoesRequeridas =
      this.reflector.get<string[]>('permissoes', context.getHandler()) ||
      this.reflector.get<string[]>('permissoes', context.getClass())

    if (!permissoesRequeridas || permissoesRequeridas.length === 0) return true

    const { user } = context.switchToHttp().getRequest()
    const permissoesUsuario: string[] = Array.isArray(user?.permissoes) ? user.permissoes : []

    return permissoesRequeridas.some((p) => permissoesUsuario.includes(p))
  }
}
