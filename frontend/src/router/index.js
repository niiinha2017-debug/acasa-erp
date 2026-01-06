import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes' 
import { storage } from '@/utils/storage'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = storage.getToken()
  const user = storage.getUser()

  // 1. Bloqueio de Autenticação básico
  if (!token && to.path !== '/login') return { path: '/login' }
  if (token && to.path === '/login') return { path: '/' }

  // 2. Bloqueio por Setor
  if (token && user) {
    // Normalizamos o setor para MAIÚSCULO para evitar erro de digitação
    const meuSetor = user.setor?.toUpperCase()
    const pastaRaiz = to.path.split('/')[1]?.toLowerCase()

    // Se for ADMIN, libera tudo (O return true interrompe o resto da função)
    if (meuSetor === 'ADMIN') return true

    // Se for a página inicial ou perfil, libera para todos logados
    if (!pastaRaiz || pastaRaiz === 'perfil') return true

    // Mapeamento (Deve bater com o nome das pastas em /pages)
    const permissaoPorPasta = {
      'FINANCEIRO': ['financeiro', 'clientes'],
      'PRODUCAO': ['producao'],
      'VENDAS': ['clientes', 'vendas'],
      // 'CONFIGURACOES' geralmente não fica aqui porque só o ADMIN entra
    }

    const pastasPermitidas = permissaoPorPasta[meuSetor] || []

    if (!pastasPermitidas.includes(pastaRaiz)) {
      console.warn(`[ACESSO NEGADO] Setor: ${meuSetor} tentou entrar em: /${pastaRaiz}`)
      return { path: '/' } // Chuta para a home
    }
  }

  return true
})
export default router