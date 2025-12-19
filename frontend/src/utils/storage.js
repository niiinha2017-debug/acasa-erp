import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig.STORAGE_KEYS.TOKEN
const USER_KEY = AppConfig.STORAGE_KEYS.USER

export const storage = {
  getToken() {
    // Agora busca na sessão temporária
    return sessionStorage.getItem(TOKEN_KEY)
  },

  setToken(token) {
    // Grava apenas enquanto a aba estiver aberta
    sessionStorage.setItem(TOKEN_KEY, token)
  },

  removeToken() {
    sessionStorage.removeItem(TOKEN_KEY)
  },

  getUser() {
    const v = sessionStorage.getItem(USER_KEY)
    return v ? JSON.parse(v) : null
  },

  setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  removeUser() {
    sessionStorage.removeItem(USER_KEY)
  },
}