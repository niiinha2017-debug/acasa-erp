import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

import DespesasCreate from '@/views/despesas/DespesasCreate.vue'
import DespesasList from '@/views/despesas/DespesasList.vue'

import Login from '@/views/Login.vue'
import Index from '@/views/Index.vue'

import ClientesList from '@/views/Clientes/ClientesList.vue'
import ClientesCreate from '@/views/Clientes/ClientesCreate.vue'

import PlanosCorteList from '@/views/PlanodeCorte/PlanosCorteList.vue'
import PlanoCorteCreate from '@/views/PlanodeCorte/PlanoCorteCreate.vue'

import OrcamentosList from '@/views/orcamento/OrcamentosList.vue'
import OrcamentoCreate from '@/views/orcamento/OrcamentoCreate.vue'  

import FornecedoresList from '@/views/fornecedores/FornecedoresList.vue'
import FornecedoresCreate from '@/views/fornecedores/FornecedoresCreate.vue'

import FuncionariosList from '@/views/funcionarios/FuncionariosList.vue'
import FuncionariosCreate from '@/views/funcionarios/FuncionariosCreate.vue'

import ProdutosList from '@/views/produtos/ProdutosList.vue'
import ProdutosCreate from '@/views/produtos/ProdutosCreate.vue'

import ConstantesCreate from '@/views/constantes/ConstantesCreate.vue'
import ConstantesList from '@/views/constantes/ConstantesList.vue'


const routes = [
{
  path: '/login',
  component: AuthLayout,
  children: [
    {
      path: '',
      name: 'login',
      component: Login,
      meta: { public: true } // 👈 AQUI
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
    {path: 'constantes',
     component: ConstantesList,
    },
    {path: 'constantes/nova',
     component: ConstantesCreate,
    },
{
  path: 'despesas',
  name: 'DespesasList',
  component: DespesasList,
},
{
  path: 'despesas/nova',
  name: 'DespesasCreate',
  component: DespesasCreate,
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
  path: 'orcamentos',
  component: OrcamentosList
},
{
  path: 'orcamentos/novo',
  component: OrcamentoCreate
},
{
  path: '/produtos',
  component: ProdutosList
},
{
  path: '/produtos/novo',
  component: ProdutosCreate
}
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
router.beforeEach((to, from, next) => {
  const auth = useAuth()

  if (to.meta.public) {
    return next()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated()) {
    return next('/login')
  }

  return next()
})


export default router


