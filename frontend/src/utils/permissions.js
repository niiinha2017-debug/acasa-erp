import { storage } from '@/utils/storage'

/**
 * Verifica se o usuário logado possui uma permissão específica
 */
export function can(permission) {
  const user = storage.getUser()

  if (!user || !Array.isArray(user.permissions)) {
    return false
  }

  return user.permissions.includes(permission)
}
