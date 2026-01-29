import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import storage from '@/utils/storage'

import { can } from '@/services/permissions'
import { buildRoutePermMap, getRequiredPerm } from '@/services/navigation-perms'

const routePermMap = buildRoutePermMap()

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

router.beforeEach(async (to) => {
  const token = storage.getToken()
  if (!token && !to.meta?.public) return { path: '/login' }

  // garante user atualizado quando estiver logado
  if (token) await ensureMe()

  const user = storage.getUser()
  const status = String(user?.status || '').toUpperCase()

  // públicas
  if (to.meta?.public) {
    if (token && to.path === '/login') {
      return status === 'ATIVO' ? { path: '/' } : { path: '/pendente' }
    }
    return true
  }

  // pendente/inativo preso
  if (status !== 'ATIVO') {
    return to.path === '/pendente' ? true : { path: '/pendente' }
  }

  if (to.path === '/pendente') return { path: '/' }

  const required = getRequiredPerm(to, routePermMap)
  if (required && !can(required)) return { path: '/' }

  return true
})


export default router
