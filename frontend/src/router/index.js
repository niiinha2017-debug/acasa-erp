import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import api from '@/services/api'
import storage from '@/utils/storage'
import { can } from '@/services/permissions'
import { AGENDA_ROUTE_PATH, hasAgendaAccess } from '@/constantes/agenda-route'
import { buildRoutePermMap, getRequiredPerm } from '@/services/navigation-perms'

const router = createRouter({
  // Alinha com Vite `base` (web: `/`, Tauri empacotado: `./`) para rotas aninhadas carregarem certo.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const routePermMap = buildRoutePermMap()

let syncingMe = null
function getAgendaHome() {
  if (hasAgendaAccess()) return { path: AGENDA_ROUTE_PATH }
  return null
}

async function ensureMe() {
  const token = storage.getToken()
  if (!token) return null

  const u = storage.getUser()
  // ✅ Sempre valida o token no servidor para evitar 401 em menu/orcamentos com token expirado
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

  if (to.path === '/login' && token) {
    const user = await ensureMe()
    if (user) {
      if (user?.senha_expirada) {
        storage.removeToken()
        storage.removeUser()
        return { path: '/login', query: { msg: 'senha_expirada' } }
      }

      if (user?.precisa_trocar_senha || String(user?.status || '').toUpperCase() !== 'ATIVO') {
        return { path: '/pendente' }
      }

      const agendaHome = getAgendaHome()
      return agendaHome || { path: '/' }
    }
  }

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
  const precisaTrocarSenha = !!user?.precisa_trocar_senha
  const senhaExpirada = !!user?.senha_expirada

  // 3.1 Senha provisória expirada: desloga e redireciona para login com mensagem
  if (senhaExpirada) {
    storage.removeToken()
    storage.removeUser()
    return { path: '/login', query: { msg: 'senha_expirada' } }
  }

  // 4. Segurança absoluta: usuário com senha provisória só acessa /pendente (menu já oculto via layout auth)
  if (precisaTrocarSenha) {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  // 5. Status PENDENTE (sem token de recuperação ativo) também redireciona para troca de senha
  if (status !== 'ATIVO') {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  // 6. Se já é ATIVO e está na tela de pendente, manda pra home
  if (status === 'ATIVO' && to.path === '/pendente') {
    const agendaHome = getAgendaHome()
    return agendaHome || { path: '/' }
  }

  const requiredPerm = getRequiredPerm(to, routePermMap)
  const allowed = requiredPerm
    ? Array.isArray(requiredPerm)
      ? requiredPerm.some((p) => can(p))
      : can(requiredPerm)
    : true
  if (requiredPerm && !allowed) {
    const agendaHome = getAgendaHome()
    if (agendaHome) return agendaHome
    if (can('index.visualizar')) return { path: '/' }
    if (to.path === '/alterar-senha') return true
    return { path: '/alterar-senha' }
  }

  return true
})

export default router
