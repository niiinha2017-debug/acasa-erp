import api from '@/services/api'

export const ClientesAPI = {
  async listar() {
    const { data } = await api.get('/clientes')
    return data
  },

  async buscar(id) {
    const { data } = await api.get(`/clientes/${id}`)
    return data
  },

  async criar(payload) {
    const { data } = await api.post('/clientes', payload)
    return data
  },

  async atualizar(id, payload) {
    const { data } = await api.patch(`/clientes/${id}`, payload)
    return data
  },

  async remover(id) {
    const { data } = await api.delete(`/clientes/${id}`)
    return data
  },

  async aniversariantes(params) {
    const { data } = await api.get('/clientes/relatorios/aniversariantes', { params })
    return data
  },

  // ✅ NOVO: buscar por nome para indicação (salva ID na tela)
  async buscarPorNome(nome) {
    const { data } = await api.get('/clientes', { params: { nome } })
    return data
  },
}
