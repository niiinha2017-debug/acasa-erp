import axios from 'axios'
import { storage } from '@/utils/storage'

const token = storage.getToken()
const resp = await api.get('/produtos', {
  headers: { Authorization: `Bearer ${token}` },
})

console.log('TOKEN USADO:', token?.slice(0, 20))
console.log('DATA:', resp.data)


const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// INTERCEPTOR DE ENVIO (Você já tem)
api.interceptors.request.use((config) => {
  const token = storage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// NOVO: INTERCEPTOR DE RESPOSTA (Trata o erro de 8 horas)
api.interceptors.response.use(
  (response) => response, // Se a resposta for sucesso, não faz nada
  (error) => {
    // Se o servidor responder 401 (Não autorizado), o token de 8h expirou
    if (error.response && error.response.status === 401) {
      storage.removeToken()
      storage.removeUser()
      
      // Redireciona para o login e limpa a memória do navegador
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api