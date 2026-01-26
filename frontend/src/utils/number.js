// src/utils/number.js
export function moedaParaNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  if (typeof valor === 'number') return valor

  // Remove tudo que não é dígito
  const apenasDigitos = String(valor).replace(/\D/g, '')
  if (!apenasDigitos) return 0

  // Converte para float real (ex: "150000" vira 1500.00)
  const n = Number(apenasDigitos) / 100
  return Number.isFinite(n) ? n : 0
}

export function numeroParaMoeda(valor) {
  // Garante que o valor seja um número antes de formatar
  const n = typeof valor === 'number' ? valor : moedaParaNumero(valor)
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Garante boolean real (checkbox)
 */
export function toBoolean(valor) {
  return !!valor
}
export const formatCurrency = numeroParaMoeda;