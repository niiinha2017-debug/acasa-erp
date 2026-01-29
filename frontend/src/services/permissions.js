import storage from '@/utils/storage'

export function can(permission) {
  const user = storage.getUser()
  if (!user) return false

  // 1. REGRA DE OURO: Se for Admin, tem acesso a TUDO
  if (user.isAdmin || user.usuario === 'Ana.P') {
    return true
  }

  // 2. Caso contrário, verifica a lista de permissões dele
  const permissions = user.permissões || []
  return permissions.includes(permission)
}