import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig.STORAGE_KEYS.TOKEN
const USER_KEY = AppConfig.STORAGE_KEYS.USER

export const storage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  getUser() {
    const v = localStorage.getItem(USER_KEY)
    try {
      // O JSON.parse é essencial porque o user é um objeto
      return v ? JSON.parse(v) : null
    } catch (e) {
      console.error("Erro ao ler usuário do storage", e)
      return null
    }
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  removeUser() {
    localStorage.removeItem(USER_KEY)
  },

  clear() {
    localStorage.clear()
  }
}