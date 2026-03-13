import { PontoService } from '@/services/ponto.service'
import { pontoStorage } from './pontoStorage'

export function usePontoAuth() {
  const token = pontoStorage.getToken()

  async function testarToken() {
    const t = pontoStorage.getToken()
    if (!t) return false

    try {
      // Usando o PontoService para manter o padrão
      await PontoService.me(t)
      return true
    } catch (e) {
      // Se der 401 ou erro de rede, limpa o lixo do storage
      pontoStorage.clear()
      return false
    }
  }

  return { token, testarToken }
}