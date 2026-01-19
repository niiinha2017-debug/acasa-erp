import { pontoStorage } from '@/modules/ponto/pontoStorage'

router.beforeEach((to) => {
  const token = pontoStorage.getToken()

  // mata login
  if (to.path === '/login') return '/'

  // se rota é pública (ativar) e já tem token, manda pra home
  if (to.meta.public && token) return '/'

  // se rota é privada e não tem token, manda ativar
  if (!to.meta.public && !token) return '/ativar'

  return true
})
