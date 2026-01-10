import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import { storage } from '@/utils/storage'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = storage.getToken()

  // ✅ 1) Bloqueio de autenticação (único)
  if (!token && to.path !== '/login') return { path: '/login' }
  if (token && to.path === '/login') return { path: '/' }

  // ✅ 2) NÃO EXISTE MAIS BLOQUEIO POR SETOR AQUI
  // Início é padrão, e o menu controla o acesso.

  return true
})

export default router
