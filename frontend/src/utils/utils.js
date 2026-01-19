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

// app/utils/utils.js (ou src/utils/utils.js)
export function calcularCustoHora(salarioMensal, diasMes = 22, horasDia = 8) {
  const s = Number(salarioMensal || 0)
  const horasMes = Number(diasMes) * Number(horasDia)
  if (!horasMes) return 0
  const v = s / horasMes
  return Math.round(v * 100) / 100
}



