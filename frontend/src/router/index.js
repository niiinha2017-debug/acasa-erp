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

  // se já estiver ATIVO e tiver id, não precisa sincronizar
  if (u?.id && status === 'ATIVO') return u

  if (!syncingMe) {
    syncingMe = api
      .get('/auth/me')
      .then(({ data }) => {
        storage.setUser(data)
        return data
      })
      .finally(() => {
        syncingMe = null
      })
  }

  return syncingMe
}

router.beforeEach(async (to) => {
  const token = storage.getToken()

  // 1) Rotas públicas
  if (to.meta?.public) {
    if (token) {
      await ensureMe()
      const user = storage.getUser()
      const status = String(user?.status || '').toUpperCase()

      // se estiver logado e tentar /login
      if (to.path === '/login') {
        return status === 'ATIVO' ? { path: '/' } : { path: '/pendente' }
      }
    }
    return true
  }

  // 2) Precisa token
  if (!token) return { path: '/login' }

  // 3) Sincroniza user (resolve status desatualizado no storage)
  await ensureMe()
  const user = storage.getUser()
  const status = String(user?.status || '').toUpperCase()

// 4) Só prende quem é PENDENTE ou INATIVO
if (status === 'PENDENTE' || status === 'INATIVO') {
  return to.path === '/pendente' ? true : { path: '/pendente' }
}


// 5) ATIVO não entra no pendente
if (to.path === '/pendente') return { path: '/' }


  // 6) Permissões por rota (somente ATIVO)
  const required = getRequiredPerm(to, routePermMap)
  if (required && !can(required)) return { path: '/producao' }

  return true
})

export default router
