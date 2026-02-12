import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import api from '@/services/api'
import storage from '@/utils/storage'
import { can } from '@/services/permissions'
import { buildRoutePermMap, getRequiredPerm } from '@/services/navigation-perms'
import { NAV_SCHEMA } from '@/services/navigation'

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

const routePermMap = buildRoutePermMap()

let syncingMe = null
const FORCE_PENDING_KEY = 'ACASA_FORCE_PENDING'

const NAV_FALLBACK_PATHS = Object.values(NAV_SCHEMA || {})
  .flatMap((items) => (items || []))
  .filter((item) => item?.to && !item?.divider)
  .map((item) => String(item.to).split('?')[0])
  .filter(Boolean)

function firstAllowedPath() {
  if (can('index.visualizar')) return '/'

  for (const path of NAV_FALLBACK_PATHS) {
    const requiredPerm = getRequiredPerm({ path }, routePermMap)
    if (!requiredPerm || can(requiredPerm)) return path
  }

  return null
}

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

  const forcePending = sessionStorage.getItem(FORCE_PENDING_KEY) === '1'
  if (forcePending) {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  const status = String(user?.status || '').toUpperCase()

  // 4. Lógica de PENDENTE (Troca de senha)
  if (status !== 'ATIVO') {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  // 5. Se já é ATIVO e está na tela de pendente, manda pra home
  if (status === 'ATIVO' && to.path === '/pendente') return { path: '/' }

  const requiredPerm = getRequiredPerm(to, routePermMap)
  if (requiredPerm && !can(requiredPerm)) {
    const fallback = firstAllowedPath()
    if (fallback && fallback !== to.path) {
      return { path: fallback }
    }

    // Evita loop infinito quando o usuario tem token, mas nenhuma permissao valida.
    return false
  }

  return true
})

export default router
