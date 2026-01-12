import axios from 'axios'
import { storage } from '@/utils/storage'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
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
  (error) => {
    if (error.response && error.response.status === 401) {
      storage.removeToken()
      storage.removeUser()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
