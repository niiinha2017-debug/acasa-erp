import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const PontoService = {
  // 1) Ativar dispositivo (pareamento via CODE + device_uuid) -> retorna { token }
  ativar: (dados) => api.post('/ponto/ativar', dados),

  // 2) Buscar dados do funcionário (nome)
  me: (token) =>
    api.get('/ponto/me', {
      headers: authHeader(token),
    }),

  // 3) Buscar registros do dia (lista simples)
  hoje: (token) =>
    api.get('/ponto/hoje', {
      headers: authHeader(token),
    }),

  // 4) Buscar último registro (opcional, se quiser usar)
  ultimo: (token) =>
    api.get('/ponto/ultimo', {
      headers: authHeader(token),
    }),

  // 5) Registrar ponto (ENTRADA / SAIDA)
  registrar: (payload, token) =>
    api.post('/ponto/registrar', payload, {
      headers: authHeader(token),
    }),
}
