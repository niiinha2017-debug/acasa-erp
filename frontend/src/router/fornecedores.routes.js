import DefaultLayout from '@/layouts/DefaultLayout.vue'

import FornecedoresList from '@/views/fornecedores/FornecedoresList.vue'
import FornecedoresCreate from '@/views/fornecedores/FornecedoresCreate.vue'

export const fornecedoresRoutes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'fornecedores',
        name: 'FornecedoresList',
        component: FornecedoresList,
        meta: { permission: 'fornecedores.ver' },
      },
      {
        path: 'fornecedores/novo',
        name: 'FornecedoresCreate',
        component: FornecedoresCreate,
        meta: { permission: 'fornecedores.criar' },
      },
    ],
  },
]
