import api from '@/services/api'
import { onlyNumbers } from '@/utils/utils'

export async function buscarCNPJ(cnpj) {
  const n = onlyNumbers(cnpj)

  if (n.length !== 14) return null

  const { data } = await api.get('/cnpj', {
    params: { cnpj: n },
  })

  if (!data || data.status === 'ERROR') return null

  return data
}
