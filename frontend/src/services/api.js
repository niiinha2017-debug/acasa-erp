import axios from 'axios'
import storage from '@/utils/storage'

// ✅ baseURL certo pra WEB + TAURI
// - Em produção web (Nginx): pode ser "/api"
// - Em Tauri/dev: deve ser "https://acasamarcenaria.com.br/api" (via .env)
// - Se não tiver VITE_API_URL definido, cai pra "/api"
// Substitua a linha do BASE_URL por esta:
const VITE_URL = import.meta.env.VITE_API_URL;

// Se o .env falhar, usamos a URL real direto para o Tauri não se perder
const BASE_URL = VITE_URL 
  ? VITE_URL.replace(/\/+$/, '') 
  : 'https://acasamarcenaria.com.br/api'; 

console.log('[API] ✅ Conectando em:', BASE_URL);

// ✅ DEBUG (você pediu inteiro)
console.log('[API] VITE_API_URL =', import.meta?.env?.VITE_API_URL)
console.log('[API] BASE_URL =', BASE_URL)

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ✅ DEBUG request
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken()

    // REMOVIDO LOG DE DEBUG PARA PERFORMANCE NO ANDROID
    // const url = (config.baseURL || '') + (config.url || '')
    // console.log('[API] ->', (config.method || 'GET').toUpperCase(), url)

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

// ✅ DEBUG response / refresh logic
api.interceptors.response.use(
  (response) => {
    // opcional: loga sucesso
    // console.log('[API] <-', response.status, response.config?.url)
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const original = error?.config

    // DEBUG erro (mostra mensagem completa do backend)
    const errData = error?.response?.data
    const requestUrl = (original?.baseURL || '') + (original?.url || '')
    const isMe = (original?.url || '').includes('/auth/me')
    if (status === 401 && isMe) {
      // 401 em /auth/me é esperado quando a sessão expirou ou token inválido; evita poluir console
      console.log('[API] Sessão expirada ou token inválido (/auth/me). Redirecionando para login.')
    } else {
      console.log('[API] ERROR status =', status)
      console.log('[API] ERROR url =', requestUrl)
      console.log('[API] ERROR data =', typeof errData === 'object' ? JSON.stringify(errData, null, 2) : errData)
    }

    // ✅ se não tem token, não tenta refresh
    const hasToken = !!storage.getToken()
    const refreshToken = storage.getRefreshToken()

    // ✅ não tenta refresh em rotas de auth
    const url = String(original?.url || '')
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')

    // ✅ tenta renovar token 1x apenas se a sessão estava ativa
    if (status === 401 && hasToken && refreshToken && !isAuthRoute && original && !original._retry) {
      original._retry = true
      try {
        const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
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
    // Evita hard reload no Android (causa loop/lag). O router vai redirecionar.
    if (status === 401) {
      try { await api.post('/auth/logout') } catch {}
      storage.removeToken()
      storage.removeUser()
      storage.removeRefreshToken()
      window.dispatchEvent(new CustomEvent('acasa-auth-logout', {
        detail: { reason: '401', url }
      }))
    }

    return Promise.reject(error)
  }
)

export default api
