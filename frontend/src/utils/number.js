// src/utils/number.js
export function moedaParaNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  if (typeof valor === 'number') return valor

  const s = String(valor).trim()
  if (!s) return 0

  // BR: "2.200,50"
  if (s.includes(',')) {
    const normalizado = s
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')

    const n = Number(normalizado)
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
  }

  // EN/Decimal: "2200.50" ou "0.0022000"
  // Se tiver ponto e dígitos dos dois lados, trata como decimal
  if (s.includes('.') && /\d+\.\d+/.test(s)) {
    const normalizado = s.replace(/[^\d.-]/g, '')
    const n = Number(normalizado)
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
  }

  // Inteiro puro: "2200"
  const apenasDigitos = s.replace(/[^\d-]/g, '')
  const n = Number(apenasDigitos)
  return Number.isFinite(n) ? n : 0
}


export function numeroParaMoeda(valor) {
  const n = (typeof valor === 'number') ? valor : moedaParaNumero(valor)
  return Number(n || 0).toLocaleString('pt-BR', {
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