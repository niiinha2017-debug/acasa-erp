import api from '@/services/api'

export function listarConstantes(params = {}) {
  return api.get('/constantes', { params })
}

export function criarConstante(data) {
  return api.post('/constantes', data)
}

export function atualizarConstante(id, data) {
  return api.put(`/constantes/${id}`, data)
}

export function removerConstante(id) {
  return api.delete(`/constantes/${id}`)
}
