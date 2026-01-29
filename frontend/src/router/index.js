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

router.beforeEach((to) => {
  const token = storage.getToken()
  const isPublic = to.meta?.public === true
  const isLogin = to.path === '/login'

  const HOME_PUBLICA = '/'
  const HOME_SISTEMA = '/producao'
  const PERM_ADMIN = 'ADMIN'

  // 1) SEM TOKEN: só entra em public/login
  if (!token && !isPublic && !isLogin) return { path: '/login' }

  // 2) COM TOKEN: não deixa ficar em / ou /login
  if (token && (to.path === HOME_PUBLICA || isLogin)) return { path: HOME_SISTEMA }

  // 3) COM TOKEN: valida permissão (só se rota não for public)
  if (token && !isPublic) {
    // admin passa direto
    if (can(PERM_ADMIN)) return true

    const requiredPerm = getRequiredPerm(to.path, routePermMap)

    // se precisar perm e não tiver → joga pra página pública (pendente)
    if (requiredPerm && !can(requiredPerm)) return { path: HOME_PUBLICA }
  }

  return true
})



export default router
