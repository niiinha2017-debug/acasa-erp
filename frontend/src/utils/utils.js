//src/utils/utils.js

import api from '@/services/api'

/* =====================
   CEP
===================== */
export async function buscarCep(cep) {
  const n = cep.replace(/\D/g, '') // Garante que só tenha números
  if (n.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${n}/json`)
    const data = await res.json()
    return data.erro ? null : data
  } catch (err) {
    return null
  }
}

export async function buscarCnpj(cnpj) {
  const limpo = String(cnpj || '').replace(/\D/g, '')
  if (limpo.length !== 14) return null

  try {
    const res = await api.get(`/utils/cnpj/${limpo}`)
    console.log('[buscarCnpj] status:', res.status)
    console.log('[buscarCnpj] data:', res.data)
    return res.data || null
  } catch (err) {
    console.log('[buscarCnpj] ERRO status:', err?.response?.status)
    console.log('[buscarCnpj] ERRO data:', err?.response?.data)
    return null
  }
}



export const calcularCustoHora = (salario) => {
  if (!salario || salario <= 0) return 0
  // Cálculo padrão: Salário / 220 horas
  return parseFloat((salario / 220).toFixed(2))
}


