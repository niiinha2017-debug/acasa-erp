import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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