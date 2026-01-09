import { ref, computed } from 'vue'
import api from '@/services/api'
import { storage } from '@/utils/storage'

// Estado Global (Singleton) - Compartilhado entre todas as páginas
const token = ref(storage.getToken())
const usuarioLogado = ref(storage.getUser())
const loading = ref(false)
const error = ref('')

/**
 * MAPA DE ACESSO (O "Cérebro" do seu ERP)
 * Define quais telas cada setor pode enxergar.
 */
const MAPA_DE_ACESSO = 
{
  'ADMIN': ['clientes',
    'fornecedores',
    'funcionarios', 
    'usuarios',
    'plano-corte', 
    'configuracoes',
    'produtos', 
    'financeiro',
    'contas-pagar',
    'contas-receber',
    'producao',
    'vendas', 
    'agenda',
    'compras',
    'dashboard',
    'constantes', 
    'despesas',],

  'FINANCEIRO': ['dashboard', 'clientes', 'financeiro', 'relatorios','plano-corte'],
  'PRODUCAO': ['dashboard', 'producao', 'estoque'],
  'VENDAS': ['dashboard', 'clientes']
}

export function useAuth() {
  
  // Verifica se o usuário está logado
  const isAuthenticated = computed(() => !!token.value)

  /**
   * FUNÇÃO CHAVE: temAcesso
   * Verifica se o setor do usuário permite ver uma tela específica
   * Ex: v-if="temAcesso('financeiro')"
   */
  const temAcesso = (nomeDaPagina) => {
    const user = usuarioLogado.value
    if (!user || !user.setor) return false
    
    // Se o setor não existir no mapa, negamos por segurança
    const permissoesDoSetor = MAPA_DE_ACESSO[user.setor.toUpperCase()] || []
    
    // ADMIN tem passe livre ou verificamos na lista
    if (user.setor.toUpperCase() === 'ADMIN') return true
    
    return permissoesDoSetor.includes(nomeDaPagina)
  }

  async function login({ usuario, senha }) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.post('/auth/login', { usuario, senha })
      
      // Salva no LocalStorage (persistência)
      storage.setToken(data.token)
      storage.setUser(data.usuario)

      // Atualiza o estado reativo (reatividade)
      token.value = data.token
      usuarioLogado.value = data.usuario

      return data
    } catch (e) {
      error.value = e?.response?.data?.message || 'Credenciais inválidas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function solicitarCadastro(dados) {
    loading.value = true
    try {
      // Envia para o backend que salva via Prisma
      const { data } = await api.post('/auth/cadastro', dados)
      return data
    } catch (e) {
      error.value = 'Erro ao solicitar cadastro'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    storage.removeToken()
    storage.removeUser()
    token.value = null
    usuarioLogado.value = null
    window.location.href = '/login' // Reset total da memória
  }

  return {
    token,
    usuarioLogado,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    solicitarCadastro,
    temAcesso // <--- Agora você pode usar isso em qualquer lugar
  }
}