import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig?.STORAGE_KEYS?.TOKEN || 'ACASA_TOKEN'
const USER_KEY = AppConfig?.STORAGE_KEYS?.USER || 'ACASA_USER'

const storage = {
  // TOKEN
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  // USER
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  removeUser() {
    localStorage.removeItem(USER_KEY)
  },
}

export default storage
