import api from './api'

function normUpper(v) {
  return String(v || '').trim().toUpperCase()
}

export const ArquivosService = {
  listar: ({ ownerType, ownerId, categoria } = {}) => {
    const owner_type = normUpper(ownerType)
    const owner_id = String(ownerId || '').replace(/\D/g, '')
    const params = { owner_type, owner_id }
    if (categoria) params.categoria = normUpper(categoria)
    return api.get('/arquivos', { params })
  },

upload: ({ ownerType, ownerId, file, categoria, slotKey, prefixo, nomeBase } = {}) => {
  if (!file) return Promise.reject(new Error('Arquivo não informado'))

  const fd = new FormData()

  // ✅ primeiro os campos
  fd.append('owner_type', normUpper(ownerType))
  fd.append('owner_id', String(ownerId || '').replace(/\D/g, ''))
  if (categoria) fd.append('categoria', normUpper(categoria))
  if (slotKey) fd.append('slot_key', normUpper(slotKey))

  // opcionais (se você usar nome bonito)
  if (prefixo) fd.append('prefixo', String(prefixo))
  if (nomeBase) fd.append('nome_base', String(nomeBase))

  // ✅ por último o arquivo
  fd.append('file', file)

  return api.post('/arquivos/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
},


  baixarBlob: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.get(`/arquivos/${cleanId}/blob`, { responseType: 'blob' })
  },

  remover: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.delete(`/arquivos/${cleanId}`)
  },
}
