import storage from '@/utils/storage'

/**
 * Verifica se o usuário tem a permissão (apenas para UI; a autorização real é no backend).
 * Regras: is_admin ou permissão "ADMIN" dão acesso total; senão, verifica a chave na lista.
 */
export function can(permission) {
  const user = storage.getUser()
  if (!user) return false

  if (user?.is_admin) return true

  const permissions = Array.isArray(user?.permissoes)
    ? user.permissoes
    : Array.isArray(user?.permissões)
      ? user.permissões
      : []

  if (permissions.includes('ADMIN')) return true

  return permissions.includes(permission)
}
