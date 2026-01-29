import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'

import api from '@/services/api'
import storage from '@/utils/storage'

import { can } from '@/services/permissions'
import { buildRoutePermMap, getRequiredPerm } from '@/services/navigation-perms'

const routePermMap = buildRoutePermMap()

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

let syncingMe = null

/**
 * Garante que temos os dados do usuário.
 * Se o usuário for PENDENTE ou não tiver ID, ele SEMPRE vai ao servidor buscar a verdade.
 */
async function ensureMe() {
  const token = storage.getToken()
  if (!token) return null

  const u = storage.getUser()
  const status = String(u?.status || '').toUpperCase()

  // Se já for ATIVO e tiver dados, não precisa de nova chamada
  if (u?.id && status === 'ATIVO') return u

  // Se não tiver syncingMe em curso, cria uma nova request
  if (!syncingMe) {
    syncingMe = api
      .get('/auth/me')
      .then(({ data }) => {
        storage.setUser(data) // Atualiza o localStorage com os dados frescos (Status, Permissões)
        return data
      })
      .catch(() => {
        // Em caso de erro (token expirado, etc), remove o token
        storage.removeToken()
        storage.removeUser()
        return null
      })
      .finally(() => {
        syncingMe = null
      })
  }

  return syncingMe
}

router.beforeEach(async (to) => {
  const token = storage.getToken()

  // 1) Tratamento de Rotas Públicas (ex: /login)
  if (to.meta?.public) {
    if (token) {
      await ensureMe()
      const user = storage.getUser()
      const status = String(user?.status || '').toUpperCase()

      if (to.path === '/login') {
        return status === 'ATIVO' ? { path: '/' } : { path: '/pendente' }
      }
    }
    return true
  }

  // 2) Se não tem token e a rota não é pública, vai para o Login
  if (!token) return { path: '/login' }

  // 3) Sincroniza dados (Fundamental para quem acabou de ser ativado)
  await ensureMe()
  const user = storage.getUser()
  const status = String(user?.status || '').toUpperCase()

  // 4) Prioridade: ATIVO não pode ficar na tela de pendente
  // Se o usuário é ATIVO e está tentando ir para /pendente, manda para a Home
  if (status === 'ATIVO' && to.path === '/pendente') {
    return { path: '/' }
  }

  // 5) Bloqueio: PENDENTE ou INATIVO são obrigados a ficar na tela de pendente
  if (status === 'PENDENTE' || status === 'INATIVO') {
    if (to.path === '/pendente') return true
    return { path: '/pendente' }
  }

  // 6) Verificação de Permissões (Somente para usuários ATIVOS)
  const required = getRequiredPerm(to, routePermMap)
  if (required && !can(required)) {
    // Se não tem permissão, manda para a Home em vez de criar um possível loop em /producao
    return { path: '/' }
  }

  return true
})

export default router