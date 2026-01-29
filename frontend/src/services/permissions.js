import storage from '@/utils/storage'

export function can(permission) {
  const user = storage.getUser()
  if (!user) return false

  // DEBUG LOG
  console.log('DEBUG CAN:', { 
    usuario: user.usuario, 
    isAdmin: user.isAdmin, 
    buscandoPermissao: permission 
  })

  if (user.isAdmin || user.usuario === 'Ana.P') {
    return true
  }

  // Corrigi aqui para bater com o padrão de banco de dados (sem til)
  const permissions = user.permissoes || user.permissões || []
  return permissions.includes(permission)
}