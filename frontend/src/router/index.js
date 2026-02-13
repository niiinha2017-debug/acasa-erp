import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import api from '@/services/api'
import storage from '@/utils/storage'
import { can } from '@/services/permissions'
import { buildRoutePermMap, getRequiredPerm } from '@/services/navigation-perms'

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

const routePermMap = buildRoutePermMap()

let syncingMe = null
const AGENDA_HOME = { path: '/agendamentos', query: { visao: 'geral' } }

async function ensureMe() {
  const token = storage.getToken()
  if (!token) return null

  const u = storage.getUser()
  // ✅ Verificação mais tolerante e Case Insensitive
  if (u?.id && String(u?.status || '').toUpperCase() === 'ATIVO') return u

  if (!syncingMe) {
    syncingMe = api.get('/auth/me')
      .then(({ data }) => {
        storage.setUser(data)
        return data
      })
      .catch((err) => {
        console.error('[Router] Erro ao validar usuário:', err)
        
        // ✅ Correção Crítica: Só desloga se for erro REAL de autenticação (401)
        // Se for erro de rede/timeout, mantemos o usuário logado com o cache local
        if (err.response && err.response.status === 401) {
          storage.removeToken()
          storage.removeUser()
          return null
        }

        // Se tiver usuario em cache, usa ele mesmo sem validar no server (Offline First)
        if (u) return u
        
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
  if (status === 'ATIVO' && to.path === '/pendente') {
    return can('agendamentos.ver') ? AGENDA_HOME : { path: '/' }
  }

  const requiredPerm = getRequiredPerm(to, routePermMap)
  if (requiredPerm && !can(requiredPerm)) {
    return can('agendamentos.ver') ? AGENDA_HOME : { path: '/' }
  }

  return true
})

export default router
