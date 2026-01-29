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

  // 2. Não tá logado? Login.
  if (!token) return { path: '/login' }

  // 3. Busca a verdade no servidor (Sincroniza Status/Permissões)
  await ensureMe()
  const user = storage.getUser()
  const status = String(user?.status || '').toUpperCase()

  // 4. Se for ATIVO e tentar ir pro pendente, volta pra home
  if (status === 'ATIVO' && to.path === '/pendente') return { path: '/' }

  // 5. Se for PENDENTE, só vê a tela de pendente
  if (status !== 'ATIVO') {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  // PRONTO: Sem mapa, sem "requiredPerm", sem complicação. 
  // O acesso aos dados quem vai barrar é o Backend se o token não tiver a permissão.
  return true
})

export default router