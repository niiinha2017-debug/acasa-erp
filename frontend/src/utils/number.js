// src/utils/number.js

export function moedaParaNumero(valor) {
  if (!valor) return 0;
  if (typeof valor === 'number') return valor;
  
  // Remove TUDO que não for número (pontos, vírgulas, letras)
  const apenasNumeros = valor.toString().replace(/\D/g, '');
  if (!apenasNumeros) return 0;
  
  // Transforma em decimal dividindo por 100 (ex: "15000" vira 150.00)
  return parseFloat((Number(apenasNumeros) / 100).toFixed(2));
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