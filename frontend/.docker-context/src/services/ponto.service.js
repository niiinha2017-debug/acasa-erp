import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const PontoService = {
  parear: (dados) => api.post('/ponto/parear', dados),

  registrar: (dados, token) =>
    api.post('/ponto/registrar', dados, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  ultimo: (token) =>
    api.get('/ponto/ultimo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
}
