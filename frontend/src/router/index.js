import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes' // 👈 A mágica: importa as rotas geradas
import { useAuth } from '../services/useauth'
import { storage } from '@/utils/storage'

// Cria o router usando as rotas automáticas
const router = createRouter({
  history: createWebHistory(),
  routes, 
})

router.beforeEach((to, from, next) => {
  const token = storage.getToken()
  const user = storage.getUser()

  if (to.meta?.public) return next()

  if (!token || !user) {
    return next('/login')
  }

  return next()
})


export default router