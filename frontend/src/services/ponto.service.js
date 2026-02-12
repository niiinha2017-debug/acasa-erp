import api from './api'

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
