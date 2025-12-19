import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useAuth } from '../services/useauth' 
import Login from '../views/Login.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

const routes = [
  { 
    path: '/login', 
    component: AuthLayout, 
    children: [
      { path: '', name: 'Login', component: Login, meta: { public: true } }
    ]
  },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      // 1. CLIENTES
      { path: 'clientes', component: () => import('../views/clientes/clienteslist.vue') },
      { path: 'clientes/novo', component: () => import('../views/clientes/clientescreate.vue') },
      
      // 2. PRODUTOS
      { path: 'produtos', component: () => import('../views/produtos/produtoslist.vue') },
      { path: 'produtos/novo', component: () => import('../views/produtos/produtoscreate.vue') },

      // 3. FORNECEDORES
      { path: 'fornecedores', component: () => import('../views/fornecedores/fornecedoreslist.vue') },
      { path: 'fornecedores/novo', component: () => import('../views/fornecedores/fornecedorescreate.vue') },

      // 4. FUNCIONÁRIOS
      { path: 'funcionarios', component: () => import('../views/funcionarios/funcionarioslist.vue') },
      { path: 'funcionarios/novo', component: () => import('../views/funcionarios/funcionarioscreate.vue') },

      // 6. PLANO DE CORTE (Pasta: planodecorte)
      { path: 'planodecorte', component: () => import('../views/planodecorte/planodecortelist.vue') },
      { path: 'planodecorte/novo', component: () => import('../views/planodecorte/planodecortecreate.vue') },

      // 7. DESPESAS
      { path: 'despesas', component: () => import('../views/despesas/despesaslist.vue') },
      { path: 'despesas/novo', component: () => import('../views/despesas/despesascreate.vue') },

      // 8. CONFIGURAÇÕES E ADMIN
      { path: 'constantes', component: () => import('../views/constantes/constanteslist.vue') },
      { path: 'usuarios', component: () => import('../views/usuarios/usuarioslist.vue') },
      { path: 'admin/solicitacoes', component: () => import('../views/admin/solicitacoesacesso.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes 
})

router.beforeEach((to, from, next) => {
  const auth = useAuth()
  if (to.meta?.public) return next()
  if (to.meta?.requiresAuth && !auth.isAuthenticated()) return next('/login')
  return next()
})

export default router