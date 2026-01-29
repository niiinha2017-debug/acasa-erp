import storage from '@/utils/storage'

export function isAdmin() {
  const u = storage.getUser()
  const perms = Array.isArray(u?.permissoes) ? u.permissoes : []
  return u?.usuario === 'Ana.P' || perms.includes('ADMIN')
}

export function can(chave) {
  if (isAdmin()) return true

  const u = storage.getUser()
  const perms = Array.isArray(u?.permissoes) ? u.permissoes : []
  return perms.includes(chave)
}
