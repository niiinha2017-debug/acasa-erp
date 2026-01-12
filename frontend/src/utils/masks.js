// src/utils/masks.js

// Remove tudo que não é número
export const onlyNumbers = (v = '') => String(v ?? '').replace(/\D/g, '')

export const maskCPF = (v = '') => {
  const n = onlyNumbers(v).slice(0, 11)
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskRG(value = '') {
  const v = onlyNumbers(value)

  if (v.length <= 8) {
    return v
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
  }

  return v
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1-$2')
}

export const maskCNPJ = (v = '') => {
  const n = onlyNumbers(v).slice(0, 14)
  return n
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export const maskTelefone = (v = '') => {
  const n = onlyNumbers(v).slice(0, 11)

  if (n.length <= 10) {
    return n
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return n
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export const maskCEP = (v = '') => {
  const n = onlyNumbers(v).slice(0, 8)
  return n.replace(/(\d{5})(\d)/, '$1-$2')
}

export const maskMoneyBR = (value) => {
  if (value === undefined || value === null || value === '') return '0,00'

  // Se o valor já for um número (ex: vindo do banco), formatamos direto
  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Se for string (digitado), limpamos e transformamos em centavos
  let v = value.replace(/\D/g, '')
  v = (Number(v) / 100).toFixed(2)
  return v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
// Em @/utils/masks.js

export const maskIE = (value) => {
  if (!value) return ''
  
  // Remove tudo que não for dígito
  let v = value.replace(/\D/g, '')
  
  // Limita a 12 dígitos (padrão 111.111.111.111)
  v = v.substring(0, 12)
  
  // Aplica a pontuação progressivamente
  v = v.replace(/(\={3})/, '$1.') // Não usado aqui, apenas exemplo
  
  // 111.111.111.111
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
}