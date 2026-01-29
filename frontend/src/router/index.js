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
  const user = storage.getUser()
  const status = String(user?.status || '').toUpperCase()

  // 1) Rotas públicas
  if (to.meta?.public) {
    // se já estiver logado:
    if (token) {
      // login: redireciona conforme status
      if (to.path === '/login') {
        return status === 'ATIVO' ? { path: '/' } : { path: '/pendente' }
      }
    }
    return true
  }

  // 2) Precisa estar logado
  if (!token) return { path: '/login' }

  // 3) Status: pendente/inativo fica preso no /pendente
  if (status !== 'ATIVO') {
    return to.path === '/pendente' ? true : { path: '/pendente' }
  }

  // 4) Se ATIVO e tentar /pendente, manda pro index
  if (to.path === '/pendente') return { path: '/' }

  // 5) Permissões por rota (só para ATIVO)
  const required = getRequiredPerm(to, routePermMap) // do seu navigation-perms
  if (required && !can(required)) return { path: '/' }

  return true
})


export default router
