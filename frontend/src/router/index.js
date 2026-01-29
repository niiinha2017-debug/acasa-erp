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

  if (!token && !isPublic && !isLogin) return { path: '/login' }

  if (token && isLogin) return { path: '/producao' }

  if (token && !isPublic) {
    const requiredPerm = getRequiredPerm(to.path, routePermMap)
    if (requiredPerm && !can(requiredPerm)) return { path: '/producao' }
  }

  return true
})


export default router
