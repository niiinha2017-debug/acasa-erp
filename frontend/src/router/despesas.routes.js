import DefaultLayout from '@/layouts/DefaultLayout.vue'

import DespesasList from '@/views/despesas/DespesasList.vue'
import DespesasCreate from '@/views/despesas/DespesasCreate.vue'

export const despesasRoutes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'despesas',
        name: 'DespesasList',
        component: DespesasList,
        meta: { permission: 'despesas.ver' },
      },
      {
        path: 'despesas/nova',
        name: 'DespesasCreate',
        component: DespesasCreate,
        meta: { permission: 'despesas.criar' },
      },
    ],
  },
]
