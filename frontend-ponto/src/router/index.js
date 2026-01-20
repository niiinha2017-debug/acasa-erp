import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'

const routes = [
  { path: '/', name: 'ponto', component: App },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(() => true)

export default router
