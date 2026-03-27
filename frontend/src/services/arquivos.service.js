import api from './api'

function normUpper(v) {
  return String(v || '').trim().toUpperCase()
}

export const ArquivosService = {
  listar: ({ ownerType, ownerId, categoria } = {}) => {
    const owner_type = normUpper(ownerType)
    const owner_id = String(ownerId || '').replace(/\D/g, '')

    const params = {}
    if (owner_type) params.owner_type = owner_type
    if (owner_id) params.owner_id = owner_id
    if (categoria) params.categoria = normUpper(categoria)

    return api.get('/arquivos', { params })
  },

  /**
   * Upload de arquivo.
   * @param {Object} opts - ownerType, ownerId, file, categoria?, slotKey?, prefixo?, nomeBase?
   * @param {Function} opts.onUploadProgress - (ev) => {} para barra de progresso (arquivos pesados)
   */
  upload: ({ ownerType, ownerId, file, categoria, slotKey, prefixo, nomeBase, onUploadProgress } = {}) => {
    if (!file) return Promise.reject(new Error('Arquivo não informado'))

    const owner_type = normUpper(ownerType)
    const owner_id = String(ownerId || '').replace(/\D/g, '')
    if (!owner_type) return Promise.reject(new Error('ownerType não informado'))
    if (!owner_id) return Promise.reject(new Error('ownerId não informado'))

    const fd = new FormData()

    // ✅ primeiro os campos
    fd.append('owner_type', owner_type)
    fd.append('owner_id', owner_id)
    if (categoria) fd.append('categoria', normUpper(categoria))
    if (slotKey) fd.append('slot_key', normUpper(slotKey))

    // opcionais
    if (prefixo) fd.append('prefixo', String(prefixo))
    if (nomeBase) fd.append('nome_base', String(nomeBase))

    // ✅ por último o arquivo
    fd.append('file', file)

    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
    if (typeof onUploadProgress === 'function') {
      config.onUploadProgress = onUploadProgress
    }

    return api.post('/arquivos/upload', fd, config)
  },

  baixarBlob: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.get(`/arquivos/${cleanId}/blob`, { responseType: 'blob' })
  },

  downloadToken: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.get(`/arquivos/${cleanId}/download-token`)
  },

  // Busca o HTML do DOCX convertido pelo backend (autenticado)
  htmlDocx: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.get(`/arquivos/${cleanId}/html`, { responseType: 'text' })
  },

  // Gera token temporário para o iframe acessar o HTML sem JWT
  htmlDocxToken: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.get(`/arquivos/${cleanId}/html-token`)
  },

  remover: (id) => {
    const cleanId = String(id || '').replace(/\D/g, '')
    return api.delete(`/arquivos/${cleanId}`)
  },

  /** Retorna o markup salvo na última ordem de serviço do cliente (ou null). */
  markupSalvoCliente: (clienteId) => {
    const id = String(clienteId || '').replace(/\D/g, '')
    return api.get(`/arquivos/markup/cliente/${id}`)
  },

  /** Lista todas as versões de orçamento do cliente agrupadas por nome base, com valor e ambientes. */
  listarOrcamentosCliente: (clienteId) => {
    const id = String(clienteId || '').replace(/\D/g, '')
    return api.get(`/arquivos/orcamentos/cliente/${id}`)
  },

  /**
   * Lê PDF/DOCX do cliente e devolve financeiro (CONTRATO) + produção (projeto/orçamento mais recente).
   * @param {string|number} clienteId
   * @param {object} [opts]
   * @param {string} [opts.orcIds] - IDs dos arquivos de orçamento a usar (ex: "1,2,3"), vindo da tela de orçamentos
   */
  consolidacaoCliente: (clienteId, opts = {}) => {
    const id = String(clienteId || '').replace(/\D/g, '')
    const params = {}
    if (opts.orcIds) params.orc_ids = opts.orcIds
    return api.get(`/arquivos/consolidacao/cliente/${id}`, { params })
  },

  /**
   * Grava parcelas em contas a receber, ordem de serviço (data entrega) e producao_etapas por ambiente.
   * @param {number} clienteId
   * @param {object} [body]
   * @param {string} [body.data_entrega_prevista] - YYYY-MM-DD
   * @param {number} [body.valor_bruto]
   * @param {number} [body.valor_impostos_nf]
   * @param {number} [body.valor_comissao]
   * @param {number} [body.valor_taxas_cartao]
 * @param {number} [body.valor_taxas_processamento_cartao]
 * @param {number} [body.valor_taxas_antecipacao_credito]
   * @param {number} [body.valor_liquido]
   * @param {number} [body.taxa_nota_percentual]
   * @param {boolean} [body.tem_nota_fiscal]
   * @param {object} [body.comissionados]
   */
  confirmarImportacaoLeitura: (clienteId, body = {}) => {
    const id = String(clienteId || '').replace(/\D/g, '')
    return api.post(`/arquivos/importacao-leitura/confirmar/${id}`, body)
  },
}
