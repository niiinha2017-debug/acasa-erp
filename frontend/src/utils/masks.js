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

  // Se vier número do banco (ex: 150.5), vira "15050" para a lógica de centavos
  let v = typeof value === 'number' 
    ? value.toFixed(2).replace(/\D/g, '') 
    : value.replace(/\D/g, '')

  // Transforma em número e formata com padrão brasileiro
  return (Number(v) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
export const maskIE = (value = '') => {
  const v = onlyNumbers(value).slice(0, 12)

  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
}
