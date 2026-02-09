import axios from 'axios'

// Usa URL absoluta no Android/Capacitor para evitar requests em localhost
const VITE_URL = import.meta.env.VITE_API_URL
const BASE_URL = VITE_URL
  ? VITE_URL.replace(/\/+$/, '')
  : 'https://acasamarcenaria.com.br/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function get(url, token) {
  return api.get(url, { headers: authHeader(token) })
}

function post(url, data, token) {
  return api.post(url, data, { headers: authHeader(token) })
}

export const PontoService = {
  ativar(dados) {
    return post('/ponto/ativar', dados)
  },

  me(token) {
    return get('/ponto/me', token)
  },

  hoje(token) {
    return get('/ponto/hoje', token)
  },

  ultimo(token) {
    return get('/ponto/ultimo', token)
  },

  // Agora o payload só precisa basicamente do { tipo: 'ENTRADA' | 'SAIDA' }
  // A observação também pode ser enviada se houver um campo de texto.
  registrar(payload, token) {
    return post('/ponto/registrar', payload, token)
  },
}