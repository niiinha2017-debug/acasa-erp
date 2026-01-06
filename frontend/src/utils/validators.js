// src/utils/validators.js
export const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())

export const normalizarUsuario = (u) => String(u || '').trim().toLowerCase().replace(/\s+/g, '')

export const validarSenhaForte = (senha) => {
  if (senha.length < 6) return 'Mínimo 6 caracteres'
  if (/\s/.test(senha)) return 'Não pode conter espaços'
  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) return 'Deve conter letras e números'
  return null
}