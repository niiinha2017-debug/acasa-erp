// src/utils/validators.js
import { onlyNumbers } from '@/utils/masks'

export const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())

export const normalizarUsuario = (u) => String(u || '').trim().toLowerCase().replace(/\s+/g, '')

export const validarSenhaForte = (senha) => {
  if (senha.length < 6) return 'Mínimo 6 caracteres'
  if (/\s/.test(senha)) return 'Não pode conter espaços'
  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) return 'Deve conter letras e números'
  return null
}

/**
 * Regra: o contrato não pode ser gerado se o cliente/contratante não estiver validado.
 * Retorna true se faltam dados obrigatórios (nome, documento, endereço completo).
 */
export function clientePrecisaValidacaoParaContrato(cliente) {
  const c = cliente || {}
  const nome = String(c.nome_completo || c.razao_social || c.nome || '').trim()
  const cpf = onlyNumbers(c.cpf || '')
  const cnpj = onlyNumbers(c.cnpj || '')
  const docOk = cpf.length === 11 || cnpj.length === 14
  const camposEndereco = [
    String(c.cep || '').trim(),
    String(c.endereco || '').trim(),
    String(c.numero || '').trim(),
    String(c.bairro || '').trim(),
    String(c.cidade || '').trim(),
    String(c.estado || '').trim(),
  ]
  return !nome || !docOk || camposEndereco.some((v) => !v)
}