import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/services/useAuth'

/* =====================
   ROUTE MODULES
===================== */
import { authRoutes } from './auth.routes'
import { despesasRoutes } from './despesas.routes'
import { funcionariosRoutes } from './funcionarios.routes'
import { fornecedoresRoutes } from './fornecedores.routes'
import { produtosRoutes } from './produtos.routes'
import { planosCorteRoutes } from './planosCorte.routes'
// clientesRoutes já existe e está correto
import { clientesRoutes } from './clientes.routes'

/* =====================
   ROUTER
===================== */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...clientesRoutes,
    ...despesasRoutes,
    ...funcionariosRoutes,
    ...fornecedoresRoutes,
    ...produtosRoutes,
    ...planosCorteRoutes,
  ],
})

/* =====================
   GLOBAL AUTH GUARD
===================== */
router.beforeEach((to, from, next) => {
  const auth = useAuth()

  // rotas públicas (login)
  if (to.meta?.public) {
    return next()
  }

  // rotas protegidas
  if (to.meta?.requiresAuth && !auth.isAuthenticated()) {
    return next('/login')
  }

  return next()
})

export default router
