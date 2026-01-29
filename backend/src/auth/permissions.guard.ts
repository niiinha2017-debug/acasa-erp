import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissoesRequeridas =
      this.reflector.get<string[]>('permissoes', context.getHandler()) ||
      this.reflector.get<string[]>('permissoes', context.getClass())

    // Se a rota não exige permissão, libera
    if (!permissoesRequeridas || permissoesRequeridas.length === 0) return true

    const { user } = context.switchToHttp().getRequest()

    // 🔴 ADIÇÃO DE SEGURANÇA: 
    // Se o usuário não estiver ATIVO, ele não pode ter permissão NENHUMA no sistema interno
    if (!user || user.status !== 'ATIVO') {
      throw new ForbiddenException('Acesso negado: Sua conta ainda não está ativa ou foi bloqueada.')
    }

    const permissoesUsuario: string[] = Array.isArray(user?.permissoes) ? user.permissoes : []

    // Verifica se o usuário tem pelo menos uma das permissões exigidas
    const temPermissao = permissoesRequeridas.some((p) => permissoesUsuario.includes(p))

    if (!temPermissao) {
      throw new ForbiddenException('Você não tem permissão para realizar esta ação.')
    }

    return true
  }
}