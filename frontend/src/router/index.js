import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import api from '@/services/api'
import storage from '@/utils/storage'
import { can } from '@/services/permissions'
import { buildRoutePermMap, getRequiredPerm } from '@/services/navigation-perms'

const routePermMap = buildRoutePermMap()

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

let syncingMe = null

async function ensureMe() {
  const token = storage.getToken()
  if (!token) return null

  const u = storage.getUser()
  const status = String(u?.status || '').toUpperCase()

  // Se já for ATIVO e tiver dados, não precisa de nova chamada
  if (u?.id && status === 'ATIVO') return u

  if (!syncingMe) {
    console.log('🔄 [ensureMe] Buscando dados frescos no servidor...')
    syncingMe = api
      .get('/auth/me')
      .then(({ data }) => {
        console.log('✅ [ensureMe] Dados recebidos:', data)
        storage.setUser(data)
        return data
      })
      .catch((err) => {
        console.error('❌ [ensureMe] Falha na sincronização:', err)
        storage.removeToken()
        storage.removeUser()
        return null
      })
      .finally(() => {
        syncingMe = null
      })
  }
  return syncingMe
}

router.beforeEach(async (to) => {
  const token = storage.getToken()
  
  // LOG 1: Entrada na rota
  console.group(`🧭 Navegação: ${to.path}`)
  console.log('Meta da rota:', to.meta)

  // 1) Rotas Públicas
  if (to.meta?.public) {
    console.log('🔓 Rota pública detectada.')
    if (token && to.path === '/login') {
      await ensureMe()
      const user = storage.getUser()
      const status = String(user?.status || '').toUpperCase()
      console.groupEnd()
      return status === 'ATIVO' ? { path: '/' } : { path: '/pendente' }
    }
    console.groupEnd()
    return true
  }

  // 2) Sem Token
  if (!token) {
    console.warn('🚫 Sem token! Redirecionando para Login.')
    console.groupEnd()
    return { path: '/login' }
  }

  // 3) Sincronização
  await ensureMe()
  const user = storage.getUser()
  const status = String(user?.status || '').toUpperCase()
  
  console.log(`👤 Usuário: ${user?.usuario} | Status: ${status}`)

  // 4) Bloqueio por Status
  if (status !== 'ATIVO') {
    if (to.path === '/pendente') {
      console.groupEnd()
      return true
    }
    console.warn(`⛔ Status ${status} não permitido aqui. Indo para /pendente`)
    console.groupEnd()
    return { path: '/pendente' }
  }

  // 5) Verificação de Permissões
  const required = getRequiredPerm(to, routePermMap)
  if (required) {
    console.log(`🔑 Permissão exigida: "${required}"`)
    const temPermissao = can(required)
    
    if (!temPermissao) {
      console.error('❌ Acesso negado pelo "can()". Redirecionando para Home.')
      console.groupEnd()
      return { path: '/' }
    }
    console.log('✅ Acesso autorizado.')
  } else {
    console.log('ℹ️ Rota sem restrição de permissão específica.')
  }

  console.groupEnd()
  return true
})

export default router