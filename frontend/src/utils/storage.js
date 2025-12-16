// src/utils/storage.js

const TOKEN_KEY = 'acasa_token'

export const storage = {
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
  },

  isAuthenticated() {
    // Retorna true ou false se o token existir
    return !!localStorage.getItem(TOKEN_KEY)
  }
}
