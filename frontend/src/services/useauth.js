import { ref, computed } from 'vue'
import api from '@/services/api'
import storage from '@/utils/storage'

const SESSION_KEY = 'ACASA_SESSION_ALIVE'

// Estado Global (Singleton)
const token = ref(storage.getToken())
const usuarioLogado = ref(storage.getUser())
const loading = ref(false)
const error = ref('')

// ✅ boot check: roda UMA vez quando o arquivo é importado
if (token.value && !sessionStorage.getItem(SESSION_KEY)) {
  // best-effort: limpa cookie HttpOnly do refresh
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {})

  storage.removeToken()
  storage.removeUser()
  token.value = null
  usuarioLogado.value = null
} else if (token.value) {
  sessionStorage.setItem(SESSION_KEY, '1')
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)')?.matches ||
  window.navigator?.standalone === true


// ✅ evita múltiplos listeners em dev/HMR
if (!window.__ACASA_VIS_LOGOUT_BOUND__) {
  window.__ACASA_VIS_LOGOUT_BOUND__ = true

  document.addEventListener('visibilitychange', () => {
    if (!isStandalone()) return
    if (document.visibilityState !== 'hidden') return
    if (!token.value) return
    

    // best-effort: limpa cookie HttpOnly mesmo quando "fecha"
    try {
      navigator.sendBeacon('/api/auth/logout')
    } catch {}

    sessionStorage.removeItem(SESSION_KEY)
    storage.removeToken()
    storage.removeUser()
    token.value = null
    usuarioLogado.value = null
  })
}


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

      // ✅ marca sessão viva
      sessionStorage.setItem(SESSION_KEY, '1')

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
    usuarioLogado.value = data
    return data
  }

  // ✅ único logout (async)
  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {}

    sessionStorage.removeItem(SESSION_KEY)

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
    syncMe,
  }
}



