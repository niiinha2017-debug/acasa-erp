// utils/storage.js
import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig?.STORAGE_KEYS?.TOKEN || 'ACASA_TOKEN'
const USER_KEY = AppConfig?.STORAGE_KEYS?.USER || 'ACASA_USER'
const REFRESH_KEY = AppConfig?.STORAGE_KEYS?.REFRESH || 'ACASA_REFRESH_TOKEN'

// utils/storage.js
const storage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) // ✅ LocalStorage para Mobile
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token) // ✅ LocalStorage para Mobile
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY)
  },
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_KEY, token)
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
  removeUser() {
    localStorage.removeItem(USER_KEY)
  },
  removeRefreshToken() {
    localStorage.removeItem(REFRESH_KEY)
  }
}

export default storage