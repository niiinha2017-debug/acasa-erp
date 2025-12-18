import DefaultLayout from '@/layouts/DefaultLayout.vue'

import PlanosCorteList from '@/views/PlanodeCorte/PlanosCorteList.vue'
import PlanoCorteCreate from '@/views/PlanodeCorte/PlanoCorteCreate.vue'

export const planosCorteRoutes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'planos-corte',
        name: 'PlanosCorteList',
        component: PlanosCorteList,
        meta: { permission: 'planos_corte.ver' },
      },
      {
        path: 'planos-corte/novo',
        name: 'PlanoCorteCreate',
        component: PlanoCorteCreate,
        meta: { permission: 'planos_corte.criar' },
      },
    ],
  },
]
