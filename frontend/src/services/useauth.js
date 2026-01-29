import { ref, computed } from 'vue'
import api from '@/services/api'
import storage from '@/utils/storage'

// Estado Global (Singleton) - Mantém o estado sincronizado entre diferentes componentes
const token = ref(storage.getToken())
const usuarioLogado = ref(storage.getUser())
const loading = ref(false)
const error = ref('')

export function useAuth() {
  // Retorna true se houver um token válido
  const isAuthenticated = computed(() => !!token.value)

  // ✅ Obtém as permissões vindas do backend de forma segura
  const permissoes = computed(() => {
    const user = usuarioLogado.value
    return Array.isArray(user?.permissoes) ? user.permissoes : []
  })

  /**
   * ✅ Valida acesso por chave (ex: 'usuarios.ver')
   * Implementa liberação total para o administrador.
   */
  const temAcesso = (chave) => {
    const user = usuarioLogado.value
    
    // 1. Se não houver usuário logado, nega qualquer acesso
    if (!user) return false

    /**
     * 2. REGRA DE ADMIN (Liberação Total)
     * Como não existem mais os campos 'setor' ou 'funcao', identificamos o 
     * privilégio administrativo pelo nome de usuário ou pela flag 'admin' nas permissões.
     */
const ehAdmin =
  user.usuario === 'Ana.P' ||
  permissoes.value.includes('ADMIN')


    if (ehAdmin) return true

    // 3. Caso contrário, verifica se a chave específica está no array de permissões
    return permissoes.value.includes(chave)
  }

  /**
   * Realiza o login e armazena os dados no storage e no estado reativo
   */
  async function login({ usuario, senha }) {
    loading.value = true
    error.value = ''
    try {
      // O backend agora retorna { token, usuario: { id, nome, permissoes... } }
      const { data } = await api.post('/auth/login', { usuario, senha })

      // Persistência local
      storage.setToken(data.token)
      storage.setUser(data.usuario)

      // Atualização do estado reativo global
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

  /**
   * Envia os dados para criação de um novo usuário
   */
  async function solicitarCadastro(dados) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/cadastro', dados)
      return data
    } catch (e) {
      error.value = e?.response?.data?.message || 'Erro ao solicitar cadastro'
      throw e
    } finally {
      loading.value = false
    }
  }

    async function esqueciSenha(email) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.post('/auth/esqueci-senha', { email })
      return data
    } catch (e) {
      error.value = e?.response?.data?.message || 'Erro ao enviar recuperação'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function alterarSenha(senha_atual, senha_nova) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.post('/auth/alterar-senha', { senha_atual, senha_nova })
      return data
    } catch (e) {
      error.value = e?.response?.data?.message || 'Erro ao alterar senha'
      throw e
    } finally {
      loading.value = false
    }
  }

async function syncMe() {
  const tokenLocal = storage.getToken()
  if (!tokenLocal) return null

  const { data } = await api.get('/auth/me')
  storage.setUser(data)
  usuarioLogado.value = data // ✅ atualiza reativo
  return data
}

  /**
   * Limpa os dados de autenticação e redireciona para o login
   */
  function logout() {
    storage.removeToken()
    storage.removeUser()
    token.value = null
    usuarioLogado.value = null
    window.location.href = '/login'
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
  esqueciSenha,
  alterarSenha,
  temAcesso,
  permissoes,
  syncMe, // ✅ add
}

}