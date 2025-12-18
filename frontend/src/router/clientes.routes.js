import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ClientesList from '@/views/Clientes/ClientesList.vue'
import ClientesCreate from '@/views/Clientes/ClientesCreate.vue'

export const clientesRoutes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'clientes',
        component: ClientesList,
        meta: { permission: 'clientes.ver' }
      },
      {
        path: 'clientes/novo',
        component: ClientesCreate,
        meta: { permission: 'clientes.criar' }
      }
    ]
  }
]
