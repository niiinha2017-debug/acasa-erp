// src/utils/text.js

/**
 * Converte qualquer texto para MAIÚSCULO
 * - Remove espaços extras
 * - Retorna string vazia se null/undefined
 */
export function upper(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor).trim().toUpperCase()
}

/**
 * Upper seguro para campos opcionais
 */
export function upperOrNull(valor) {
  if (!valor) return null
  return String(valor).trim().toUpperCase()
}

/**
 * Campos que NÃO devem ser upper (controle explícito)
 */
export function raw(valor) {
  return valor
}
