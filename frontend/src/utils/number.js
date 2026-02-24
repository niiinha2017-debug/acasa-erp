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
  let n = 0

  if (typeof valor === 'number') {
    n = valor
  } else {
    const raw = String(valor ?? '').trim()

    if (!raw) {
      n = 0
    } else {
      // Quando vem do backend (ex.: "2500" ou "2500.00"), trata como valor real em reais.
      // Quando vier mascarado (ex.: "2.500,00"), normaliza para número corretamente.
      const temVirgula = raw.includes(',')
      const temPonto = raw.includes('.')

      if (temVirgula && temPonto) {
        // Formato pt-BR com milhar e centavos: 2.500,75
        const normalizado = raw.replace(/\./g, '').replace(',', '.')
        const parsed = Number(normalizado)
        n = Number.isFinite(parsed) ? parsed : moedaParaNumero(raw)
      } else if (temVirgula) {
        // Formato pt-BR com centavos: 2500,75
        const parsed = Number(raw.replace(',', '.'))
        n = Number.isFinite(parsed) ? parsed : moedaParaNumero(raw)
      } else if (temPonto) {
        // Pode vir do backend como decimal: 2500.75
        const parsed = Number(raw)
        n = Number.isFinite(parsed) ? parsed : moedaParaNumero(raw)
      } else {
        // Somente dígitos vindos de API também representam reais: "2500"
        const parsed = Number(raw)
        n = Number.isFinite(parsed) ? parsed : moedaParaNumero(raw)
      }
    }
  }

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