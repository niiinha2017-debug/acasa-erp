import axios from 'axios'

// URL da API. No build de produção use .env.production com VITE_API_URL apontando
// para o MESMO backend onde os convites são criados (ex: https://api.acasamarcenaria.com.br/api).
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
  registrar(payload, token) {
    return post('/ponto/registrar', payload, token)
  },

  /** Comprovante em imagem (png/jpeg) para compartilhar */
  comprovanteImagem(registroId, token, formato = 'png') {
    return api.get(`/ponto/comprovante/${registroId}`, {
      headers: authHeader(token),
      params: { formato },
      responseType: 'blob',
    })
  },

  /** Compat: mantém assinatura antiga */
  comprovantePng(registroId, token) {
    return this.comprovanteImagem(registroId, token, 'png')
  },
}