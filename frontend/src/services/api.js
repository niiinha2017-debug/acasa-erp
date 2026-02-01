import axios from 'axios'
import storage from '@/utils/storage'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
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

    // ✅ se não tem token, não tenta refresh (evita relogar após logout)
    const hasToken = !!storage.getToken()

    // ✅ não tenta refresh em rotas de auth
    const url = String(original?.url || '')
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')

    // ✅ tenta renovar token 1x apenas se a sessão estava ativa (tem token)
    if (status === 401 && hasToken && !isAuthRoute && original && !original._retry) {
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
    }

    // ✅ 401 sem token / refresh falhou -> encerra sessão
    if (status === 401) {
      try { await api.post('/auth/logout') } catch {}
      storage.removeToken()
      storage.removeUser()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
