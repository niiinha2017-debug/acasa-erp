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

  // ✅ se estiver logado, não deixa cair na home placeholder
  if (token && to.path === '/') return { path: '/producao' }

  // ✅ evita loop: se já está indo pro login, não redireciona pro login de novo
  if (!token && !isPublic && !isLogin) return { path: '/login' }

  if (token && isLogin) return { path: '/producao' }

  // 🔒 TRAVA PERMISSÃO (somente se tiver token e a rota não for public)
  if (token && !isPublic) {
    const requiredPerm = getRequiredPerm(to.path, routePermMap)

    // se a rota estiver no NAV_SCHEMA e o usuário não tiver permissão → joga pro /producao
    if (requiredPerm && !can(requiredPerm)) return { path: '/producao' }
  }

  return true
})

export default router
