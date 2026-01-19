import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import storage from '@/utils/storage'


const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = storage.getToken()
  const isPublic = to.meta?.public === true
  const isLogin = to.path === '/login'

  // se estiver logado, não deixa cair na home placeholder
  if (token && to.path === '/') return { path: '/producao' }

  // 🔒 evita loop: se já está indo pro login, não redireciona pro login de novo
  if (!token && !isPublic && !isLogin) return { path: '/login' }

  if (token && isLogin) return { path: '/producao' }

  return true
})


export default router
