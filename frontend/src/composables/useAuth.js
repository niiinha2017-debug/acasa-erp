import { ref } from 'vue'

export function useAuth() {
  console.log('🧩 [useAuth] INSTANCIADO')

  const loading = ref(false)
  const error = ref(null)

  async function login({ email, password }) {
    console.log('🔐 [useAuth.login] chamado')
    console.log('📧 email:', email)
    console.log('🔑 password:', password)

    loading.value = true
    error.value = null

    try {
      console.log('⏳ iniciando login...')

      // 🔁 AQUI depois entra o fetch real
      // const response = await fetch(...)

      // SIMULA SUCESSO
      localStorage.setItem('acasa_token', 'TOKEN_TESTE')
      localStorage.setItem('acasa_user', JSON.stringify({ email }))

      console.log('💾 token salvo:', localStorage.getItem('acasa_token'))

      return { success: true }

    } catch (err) {
      console.error('❌ erro no login:', err)
      error.value = 'Erro ao efetuar login'
      return { success: false }

    } finally {
      loading.value = false
      console.log('⏹ loading =', loading.value)
    }
  }

  function logout() {
    console.log('🚪 [useAuth.logout] chamado')

    console.log('🧹 antes do logout, token =', localStorage.getItem('acasa_token'))

    localStorage.removeItem('acasa_token')
    localStorage.removeItem('acasa_user')

    console.log('🧼 depois do logout, token =', localStorage.getItem('acasa_token'))
  }

  function isAuthenticated() {
    const token = localStorage.getItem('acasa_token')
    const result = !!token

    console.log('🔍 [useAuth.isAuthenticated]')
    console.log('🔑 token:', token)
    console.log('✅ resultado:', result)

    return result
  }

  return {
    loading,
    error,
    login,
    logout,
    isAuthenticated
  }
}
