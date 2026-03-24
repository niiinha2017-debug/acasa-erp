import axios from 'axios'
import storage from '@/utils/storage'

const MOJIBAKE_REGEX = /(Ã.|Â|�|â€™|â€œ|â€|ðŸ)/u

function debugLog() {
  // Debug ingest desativado (evita ERR_CONNECTION_REFUSED quando o serviço não está rodando)
}

function findMojibake(value, path = 'root') {
  if (typeof value === 'string') {
    if (MOJIBAKE_REGEX.test(value)) return { path, value }
    return null
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findMojibake(value[i], `${path}[${i}]`)
      if (found) return found
    }
    return null
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    for (const key of keys) {
      const found = findMojibake(value[key], `${path}.${key}`)
      if (found) return found
    }
    return null
  }
  return null
}

// ✅ baseURL:
// - VITE_API_URL no .env: usado em todos os ambientes.
// - Em desenvolvimento local, navegador e Tauri usam localhost.
// - Android e builds de produção usam API remota por padrão.
const VITE_URL = import.meta.env.VITE_API_URL
const VITE_PROXY_TARGET = import.meta.env.VITE_API_PROXY_TARGET
const IS_DEV = !!import.meta.env.DEV
const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__)

function getDirectDevApiUrl() {
  const target = String(VITE_PROXY_TARGET || 'http://127.0.0.1:3001').replace(/\/+$/, '')
  return `${target}/api`
}

function isHttpDevOrigin() {
  if (typeof window === 'undefined') return false
  const origin = String(window.location.origin || '')
  return /^https?:\/\/(127\.0\.0\.1|localhost):(5173|5175)$/i.test(origin)
}

function getBaseUrl() {
  if (VITE_URL) return String(VITE_URL).replace(/\/+$/, '')
  // Desenvolvimento local no navegador/Tauri com devUrl HTTP: usa o proxy do Vite.
  if (IS_DEV && isHttpDevOrigin()) return '/api'
  // Desenvolvimento local no Tauri com origem interna: fala direto com o backend do host.
  if (IS_DEV && isTauri) return getDirectDevApiUrl()
  // Demais cenários de dev local.
  if (IS_DEV) return getDirectDevApiUrl()
  // Builds nativos/produção: API remota por padrão.
  return 'https://acasamarcenaria.com.br/api'
}

const BASE_URL = getBaseUrl() 

export function getApiBaseUrl() {
  return BASE_URL
}


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
    const bad = findMojibake(response?.data)
    if (bad) {
      debugLog({
        hypothesisId: 'H1',
        location: 'src/services/api.js:response.success',
        message: 'Mojibake detectado em payload de sucesso da API',
        data: {
          url: response?.config?.url || '',
          status: response?.status || null,
          path: bad.path,
          sample: String(bad.value).slice(0, 180)
        }
      })
    }
    // opcional: loga sucesso
    // console.log('[API] <-', response.status, response.config?.url)
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const original = error?.config
    const isNetworkError = !error?.response && (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error'))
    const url = String(original?.url || '')
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/esqueci-senha')

    // DEBUG erro (mostra mensagem completa do backend)
    const errData = error?.response?.data
    const requestUrl = (original?.baseURL || '') + (original?.url || '')
    const isMe = (original?.url || '').includes('/auth/me')
    const is401 = status === 401
    // 401: loga uma vez só (evita dezenas de linhas iguais quando várias requisições falham sem token)
    if (is401 && !isMe && !isAuthRoute) {
      if (!window.__acasa_401_logged) {
        window.__acasa_401_logged = true
        setTimeout(() => { window.__acasa_401_logged = false }, 2000)
        console.warn('[API] Não autenticado (401). Faça login em /login ou verifique se o token expirou.')
      }
    } else if (!(is401 && isMe)) {
      if (isNetworkError) {
        const base = original?.baseURL || 'http://localhost:3001/api'
        console.warn(
          '[API] Backend indisponível (conexão recusada).',
          'URL:', base,
          '— Requisição:', requestUrl,
          '\n→ Para desenvolvimento local, inicie o backend: cd acasa-erp/backend && npm run start:dev'
        )
      } else {
        console.log('[API] ERROR status =', status)
        console.log('[API] ERROR url =', requestUrl)
        console.log('[API] ERROR data =', typeof errData === 'object' ? JSON.stringify(errData, null, 2) : errData)
      }
      const badErrorData = findMojibake(errData)
      if (badErrorData) {
        debugLog({
          hypothesisId: 'H2',
          location: 'src/services/api.js:response.error',
          message: 'Mojibake detectado em payload de erro da API',
          data: {
            url: requestUrl || '',
            status: status || null,
            path: badErrorData.path,
            sample: String(badErrorData.value).slice(0, 180)
          }
        })
      }
    }

    // ✅ se não tem token, não tenta refresh
    const hasToken = !!storage.getToken()
    const refreshToken = storage.getRefreshToken()

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
    if (status === 401 && !isAuthRoute) {
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
