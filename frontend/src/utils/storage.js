import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig.STORAGE_KEYS.TOKEN
const USER_KEY = AppConfig.STORAGE_KEYS.USER

export const storage = {
  getToken() {
    // sessionStorage apaga ao fechar a aba
    return sessionStorage.getItem(TOKEN_KEY)
  },

  setToken(token) {
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