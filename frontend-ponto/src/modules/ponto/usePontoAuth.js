import api from '@/services/api'
import { pontoStorage } from './pontoStorage'

export function usePontoAuth() {
  const token = pontoStorage.getToken()

  async function testarToken() {
    const t = pontoStorage.getToken()
    if (!t) return false

    try {
      // endpoint simples só pra validar guard
      await api.get('/ponto/me', {
        headers: { Authorization: `Bearer ${t}` },
      })
      return true
    } catch (e) {
      pontoStorage.clear()
      return false
    }
  }

  return { token, testarToken }
}
