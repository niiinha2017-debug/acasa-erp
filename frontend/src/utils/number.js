// src/utils/number.js
export function moedaParaNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  if (typeof valor === 'number') return valor

  const s = String(valor).trim()

  // Se tem vírgula, interpreta como moeda BR (2.200,50)
  if (s.includes(',')) {
    const normalizado = s
      .replace(/\./g, '')     // remove separador de milhar
      .replace(',', '.')      // vírgula vira ponto
      .replace(/[^\d.-]/g, '') // remove lixo

    const n = Number(normalizado)
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
  }

  // Se não tem vírgula, interpreta como reais (2200 = 2200)
  const apenasDigitos = s.replace(/\D/g, '')
  return apenasDigitos ? Number(apenasDigitos) : 0
}


export function numeroParaMoeda(valor) {
  const n = (typeof valor === 'number') ? valor : moedaParaNumero(valor);
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
/**
 * Garante boolean real (checkbox)
 */
export function toBoolean(valor) {
  return !!valor
}
export const formatCurrency = numeroParaMoeda;