import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

import Dashboard from '@/views/Dashboard.vue'
import ClientesList from '@/views/Clientes/ClientesList.vue'
import Login from '@/views/Login.vue'

const routes = [
  {
    path: '/login',
    component: Login
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        component: Dashboard
      },
      {
        path: 'clientes',
        component: ClientesList
      }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
