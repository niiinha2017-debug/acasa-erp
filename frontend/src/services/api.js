import axios from 'axios'
import storage from '@/utils/storage'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ✅ necessário pro cookie HttpOnly ir junto no refresh/logout
})

api.interceptors.request.use((config) => {
  const token = storage.getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const original = error?.config

    // ✅ tenta renovar token 1x antes de deslogar
    if (status === 401 && original && !original._retry) {
      original._retry = true

      try {
        const { data } = await api.post('/auth/refresh')
        if (data?.token) {
          storage.setToken(data.token)

          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${data.token}`

          return api(original)
        }
      } catch (e) {
        // cai pro logout abaixo
      }

      // refresh falhou -> encerra sessão
      try { await api.post('/auth/logout') } catch {}
      storage.removeToken()
      storage.removeUser()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
