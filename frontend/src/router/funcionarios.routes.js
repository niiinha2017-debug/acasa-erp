import DefaultLayout from '@/layouts/DefaultLayout.vue'

import FuncionariosList from '@/views/funcionarios/FuncionariosList.vue'
import FuncionariosCreate from '@/views/funcionarios/FuncionariosCreate.vue'

export const funcionariosRoutes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'funcionarios',
        name: 'FuncionariosList',
        component: FuncionariosList,
        meta: { permission: 'funcionarios.ver' },
      },
      {
        path: 'funcionarios/novo',
        name: 'FuncionariosCreate',
        component: FuncionariosCreate,
        meta: { permission: 'funcionarios.criar' },
      },
    ],
  },
]
