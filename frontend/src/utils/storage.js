// utils/storage.js
import { AppConfig } from '@/services/config'

const TOKEN_KEY = AppConfig?.STORAGE_KEYS?.TOKEN || 'ACASA_TOKEN'
const USER_KEY = AppConfig?.STORAGE_KEYS?.USER || 'ACASA_USER'

const storage = {
  // Mudamos para sessionStorage: Fechou a aba, o navegador apaga o token.
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY)
  },
  setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  },
  removeToken() {
    sessionStorage.removeItem(TOKEN_KEY)
  },

  // O USER pode ficar no localStorage se quiser que o nome dele 
  // continue aparecendo na tela de login, ou mude para session também.
  getUser() {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  removeUser() {
    sessionStorage.removeItem(USER_KEY)
  },
}

export default storage