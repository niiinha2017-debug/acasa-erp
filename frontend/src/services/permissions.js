import storage from '@/utils/storage'

export function can(permission) {
  const user = storage.getUser()
  if (!user) return false

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
