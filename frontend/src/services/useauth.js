import { ref } from 'vue'
import api from '@/services/api'
import { storage } from '@/utils/storage'

const token = ref(storage.getToken())
const usuarioLogado = ref(storage.getUser())
const loading = ref(false)
const error = ref('')

export function useAuth() {
  async function login({ usuario, senha }) {
    loading.value = true
    error.value = ''

    try {
      const { data } = await api.post('/auth/login', { usuario, senha })

      // 🔥 backend retorna { token, usuario }
      storage.setToken(data.token)
      storage.setUser(data.usuario)

      token.value = data.token
      usuarioLogado.value = data.usuario

      return data
    } catch (e) {
      error.value = e?.response?.data?.message || 'Erro ao fazer login'
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
  }

  return {
    token,
    usuarioLogado,
    loading,
    error,
    login,
    logout,
  }
}
