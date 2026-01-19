import { pontoStorage } from '@/modules/ponto/pontoStorage'

router.beforeEach((to) => {
  const token = pontoStorage.getToken()

  // 🚫 NUNCA redirecionar para /login (isso é do ERP)
  // 🚫 NUNCA redirecionar para /ativar (não existe rota)

  // Se não tem token, deixa o app carregar
  // O Index.vue decide se ativa ou mostra tela inicial
  if (!token) return true

  // Se tem token, segue normal
  return true
})
