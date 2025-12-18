import AuthLayout from '@/layouts/AuthLayout.vue'
import Login from '@/views/Login.vue'

export const authRoutes = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: Login,
        meta: { public: true },
      },
    ],
  },
]
