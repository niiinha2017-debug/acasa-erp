import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/login.vue'
import Home from '@/pages/index.vue'
import { storage } from '@/utils/storage'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { public: true } },
    { path: '/', name: 'home', component: Home },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const token = storage.getToken()
  const isPublic = !!to.meta.public

  // se não tem token e rota não é pública => manda pro login
  if (!token && !isPublic) {
    return { name: 'login' }
  }

  // se tem token e tenta ir pro login => manda pra home
  if (token && to.name === 'login') {
    return { name: 'home' }
  }

  return true
})

export default router
