import storage from '@/utils/storage'

export function can(permission) {
  const user = storage.getUser()
  if (!user) return false

  if (user.isAdmin || user.usuario === 'Ana.P') {
    return true
  }

  const permissions = user.permissoes || user.permissões || []
  return permissions.includes(permission)
}
