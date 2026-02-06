import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import api from '@/services/api'
import storage from '@/utils/storage'

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

let syncingMe = null

async function ensureMe() {
  const token = storage.getToken()
  if (!token) return null

  const u = storage.getUser()
  if (u?.id && u?.status === 'ATIVO') return u

  if (!syncingMe) {
    syncingMe = api.get('/auth/me')
      .then(({ data }) => {
        storage.setUser(data)
        return data
      })
      .catch(() => {
        storage.removeToken()
        storage.removeUser()
        return null
      })
      .finally(() => { syncingMe = null })
  }
  return syncingMe
}

router.beforeEach(async (to) => {
  const token = storage.getToken()

  // 1. Rota Pública? Deixa passar.
  if (to.meta?.public) return true

  // 2. Não tem token? Login direto.
  if (!token) return { path: '/login' }

  // 3. Sincroniza com o servidor. 
  // Se ensureMe falhar, ele já limpa o storage e retorna null.
  const user = await ensureMe()
  
  // ❌ AQUI ESTAVA O ERRO: Se o servidor não validou o usuário, bloqueia!
  if (!user) {
    return { path: '/login' }
  }

  const status = String(user?.status || '').toUpperCase()

  // 4. Lógica de PENDENTE (Troca de senha)
  if (status !== 'ATIVO') {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  // 5. Se já é ATIVO e está na tela de pendente, manda pra home
  if (status === 'ATIVO' && to.path === '/pendente') return { path: '/' }

  return true
})

export default router