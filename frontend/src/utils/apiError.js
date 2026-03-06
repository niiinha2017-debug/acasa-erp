/**
 * Extrai mensagem de erro amigável a partir de erros da API (axios).
 * Exibe a mensagem retornada pelo backend em vez de "Request failed with status code 500".
 */
export function getApiErrorMessage(err, fallback = 'Erro inesperado.') {
  if (!err) return fallback
  const data = err?.response?.data
  const status = err?.response?.status

  // Mensagem explícita do backend (Nest/Prisma)
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
    if (Array.isArray(data.message) && data.message.length) return data.message[0]
    if (typeof data.error === 'string' && data.error.trim()) return data.error.trim()
  }

  // Status HTTP legível
  if (status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.'
  if (status === 401) return 'Sessão expirada. Faça login novamente.'
  if (status === 403) return 'Acesso negado.'
  if (status === 404) return 'Recurso não encontrado.'
  if (status === 422) return data?.message || 'Dados não processáveis. Verifique os campos.'
  if (status === 500) return data?.message || 'Erro interno no servidor. Tente novamente ou contate o suporte.'

  // Mensagem do axios/network
  if (typeof err.message === 'string' && err.message.trim()) return err.message.trim()
  return fallback
}
