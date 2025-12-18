import DefaultLayout from '@/layouts/DefaultLayout.vue'

import ProdutosList from '@/views/produtos/ProdutosList.vue'
import ProdutosCreate from '@/views/produtos/ProdutosCreate.vue'

export const produtosRoutes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'produtos',
        name: 'ProdutosList',
        component: ProdutosList,
        meta: { permission: 'produtos.ver' },
      },
      {
        path: 'produtos/novo',
        name: 'ProdutosCreate',
        component: ProdutosCreate,
        meta: { permission: 'produtos.criar' },
      },
    ],
  },
]
