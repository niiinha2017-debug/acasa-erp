// utils/storage.js
import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig?.STORAGE_KEYS?.TOKEN || 'ACASA_TOKEN'
const USER_KEY = AppConfig?.STORAGE_KEYS?.USER || 'ACASA_USER'

// utils/storage.js
const storage = {
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY) // Mudado para session
  },
  setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token) // Mudado para session
  },
  getUser() {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  removeToken() {
    sessionStorage.removeItem(TOKEN_KEY)
  },
  removeUser() {
    sessionStorage.removeItem(USER_KEY)
  }
}

export default storage