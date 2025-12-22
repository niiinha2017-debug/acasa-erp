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