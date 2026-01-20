import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  // withCredentials: true, // só se você usa cookies/sessão (se não usa, pode remover)
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
  // pareamento via CODE + device_uuid -> { token }
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

  // payload: { tipo, latitude, longitude, precisao_metros, ... }
  // OBS: endereço (cep/rua/bairro/cidade/estado) vem do backend via geo, não manda aqui
  registrar(payload, token) {
    return post('/ponto/registrar', payload, token)
  },
}
