import { ref } from 'vue'
import api from '@/services/api'
import { storage } from '@/utils/storage'

/* =====================
   STATE GLOBAL
===================== */
const token = ref(storage.getToken())
const user = ref(storage.getUser())
const loading = ref(false)

/* =====================
   COMPOSABLE
===================== */
export function useAuth() {

  /* =====================
     LOGIN
  ===================== */
  async function login({ email, password }) {
    loading.value = true

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      })

      token.value = data.token
      user.value = data.user

      storage.setToken(data.token)
      storage.setUser(data.user)

      return {
        success: true,
        user: data.user,
      }

    } catch (error) {
      console.error('❌ Erro no login:', error)

      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Erro ao realizar login',
      }

    } finally {
      loading.value = false
    }
  }

  /* =====================
     LOGOUT
  ===================== */
  function logout() {
    token.value = null
    user.value = null

    storage.removeToken()
    storage.removeUser()
  }

  /* =====================
     AUTH CHECK
  ===================== */
  function isAuthenticated() {
    return !!token.value && !!user.value
  }

  /* =====================
     EXPORT
  ===================== */
  return {
    token,
    user,
    loading,

    login,
    logout,
    isAuthenticated,
  }
}
