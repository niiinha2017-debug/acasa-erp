import storage from '@/utils/storage'

/**
 * Verifica se o usuário tem a permissão.
 * is_admin libera tudo (qualquer permissão retorna true).
 */
export function can(permission) {
  const user = storage.getUser()
  if (!user) return false

  // is_admin: acesso total, ignora lista de permissões
  if (user?.is_admin) return true

  const permissions = Array.isArray(user?.permissoes)
    ? user.permissoes
    : Array.isArray(user?.permissões)
      ? user.permissões
      : []

  // ✅ ADMIN geral via permissão (painel)
  if (permissions.includes('ADMIN')) return true

  // (opcional) manter a exceção da Ana.P enquanto você quiser
  if (user.usuario === 'Ana.P') return true

  return permissions.includes(permission)
}
