import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

import Login from '@/views/Login.vue'
import Index from '@/views/Index.vue'

import ClientesList from '@/views/Clientes/ClientesList.vue'
import ClientesCreate from '@/views/Clientes/ClientesCreate.vue'

import PlanosCorteList from '@/views/PlanodeCorte/PlanosCorteList.vue'
import PlanoCorteCreate from '@/views/PlanodeCorte/PlanoCorteCreate.vue'


import FornecedoresList from '@/views/fornecedores/FornecedoresList.vue'
import FornecedoresCreate from '@/views/fornecedores/FornecedoresCreate.vue'

import FuncionariosList from '@/views/funcionarios/FuncionariosList.vue'
import FuncionariosCreate from '@/views/funcionarios/FuncionariosCreate.vue'

import ProdutosList from '@/views/produtos/ProdutosList.vue'
import ProdutosCreate from '@/views/produtos/ProdutosCreate.vue'



const routes = [
  {
    path: '/login',
    component: AuthLayout,
    meta: { public: true },
    children: [
      {
        path: '',
        name: 'login',
        component: Login,
      }
    ]
  },

{
  path: '/',
  component: DefaultLayout,
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      name: 'dashboard',
      component: Index,
    },
{
  path: 'planos-corte',
  component: PlanosCorteList,
},
{
  path: 'planos-corte/novo',
  component: PlanoCorteCreate,
},



    {
  path: 'clientes',
  component: ClientesList,
},
{
  path: 'clientes/novo',
  component: ClientesCreate,
},

{
  path: 'fornecedores',
  component: FornecedoresList,
},
{
  path: 'fornecedores/novo',
  component: FornecedoresCreate,
},

{
  path: 'funcionarios',
  component: FuncionariosList,
},
{
  path: 'funcionarios/novo',
  component: FuncionariosCreate,
},

{
  path: 'produtos',
  name: 'produtos',
  component: ProdutosList,
},

{
  path: 'produtos/novo',
  component: ProdutosCreate,
},
  ]
},

  // fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* 🔐 GUARDA GLOBAL */
router.beforeEach((to) => {
  const auth = useAuth()
  const isPublic = to.meta.public
  const isAuthenticated = auth.isAuthenticated()

  console.log('🧭 ROUTER GUARD')
  console.log('➡️ rota:', to.path)
  console.log('🔐 autenticado:', isAuthenticated)

  if (!isPublic && !isAuthenticated) {
    console.warn('⛔ bloqueado, redirecionando para /login')
    return '/login'
  }

  if (to.path === '/login' && isAuthenticated) {
    console.log('🔁 já logado, indo para /')
    return '/'
  }
})

export default router
