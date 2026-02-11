import { ref, computed } from 'vue'
import api from '@/services/api'
import storage from '@/utils/storage'

const SESSION_KEY = 'ACASA_SESSION_ALIVE'
const FORCE_PENDING_KEY = 'ACASA_FORCE_PENDING'

// Estado Global (Singleton)
const token = ref(storage.getToken())
const usuarioLogado = ref(storage.getUser())
const loading = ref(false)
const error = ref('')

// ✅ boot check: roda UMA vez quando o arquivo é importado
// useAuth.js

// ✅ useAuth: Lógica simplificada e persistente para Mobile/PWA
if (token.value) {
  // Apenas garante que o estado reativo esteja sincronizado com o storage no boot
  if (!usuarioLogado.value) {
    usuarioLogado.value = storage.getUser()
  }
}

// REMOVIDO: Lógica 'SESSION_KEY' e 'pagehide' que forçavam logout indevido no Android.
// O usuário deve permanecer logado até clicar explicitamente em Sair.



export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  const permissoes = computed(() => {
    const user = usuarioLogado.value
    return Array.isArray(user?.permissoes) ? user.permissoes : []
  })

  const temAcesso = (chave) => {
    const user = usuarioLogado.value
    if (!user) return false

    const ehAdmin = user.usuario === 'Ana.P' || permissoes.value.includes('ADMIN')
    if (ehAdmin) return true

    return permissoes.value.includes(chave)
  }

  async function login({ usuario, senha }) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await api.post('/auth/login', { usuario, senha })

      storage.setToken(data.token)
      storage.setUser(data.usuario)
      if (data.refresh_token) {
        storage.setRefreshToken(data.refresh_token)
      }

      // ✅ marca sessão viva
      sessionStorage.setItem(SESSION_KEY, '1')

      token.value = data.token
      usuarioLogado.value = data.usuario

      // Força fluxo de troca de senha quando backend sinaliza senha provisória.
      if (data?.precisa_trocar_senha) {
        sessionStorage.setItem(FORCE_PENDING_KEY, '1')
      } else {
        sessionStorage.removeItem(FORCE_PENDING_KEY)
      }

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

// Mude de: async function alterarSenha(senha_atual, senha_nova)
// Para:
async function alterarSenha(dados) { // dados = { senha_atual, senha_nova }
  loading.value = true
  error.value = ''
  try {
    // Passamos o objeto 'dados' direto para o axios
    const { data } = await api.post('/auth/alterar-senha', dados)
    sessionStorage.removeItem(FORCE_PENDING_KEY)
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
    usuarioLogado.value = data
    if (String(data?.status || '').toUpperCase() === 'ATIVO') {
      sessionStorage.removeItem(FORCE_PENDING_KEY)
    }
    return data
  }

  // ✅ único logout (async)
  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {}

    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(FORCE_PENDING_KEY)

    storage.removeToken()
    storage.removeUser()
    storage.removeRefreshToken()
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
    syncMe,
  }
}



