import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ✅ Pega permissões do handler ou da classe e normaliza para array
    const permissoesRequeridasRaw =
      this.reflector.get<any>('permissoes', context.getHandler()) ||
      this.reflector.get<any>('permissoes', context.getClass())

    const permissoesRequeridas: string[] = Array.isArray(permissoesRequeridasRaw)
      ? permissoesRequeridasRaw
      : permissoesRequeridasRaw
        ? [String(permissoesRequeridasRaw)]
        : []

    // Se a rota não exige permissão, libera
    if (permissoesRequeridas.length === 0) return true

    const { user } = context.switchToHttp().getRequest()

    // 🔒 Segurança: só usuário ATIVO pode acessar rotas internas com permissão
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
