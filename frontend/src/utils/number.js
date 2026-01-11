// src/utils/number.js

/**
 * Converte valor monetário pt-BR para número
 * Exemplos:
 *  "8,60"   -> 8.6
 *  "1.234,56" -> 1234.56
 *  10       -> 10
 *  null     -> null
 */
export function moedaParaNumero(valor) {
  if (valor === null || valor === undefined) return null

  const str = String(valor).trim()
  if (!str) return null

  return Number(
    str
      .replace(/\./g, '') // remove milhar
      .replace(',', '.')  // troca decimal
  )
}

/**
 * Converte número para pt-BR (string)
 * 8.6 -> "8,60"
 */
export function numeroParaMoeda(valor) {
  if (valor === null || valor === undefined) return ''
  return Number(valor).toLocaleString('pt-BR', {
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