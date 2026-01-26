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

  // Se for número (ex: 1500.5), transforma em string de centavos (150050)
  let v = typeof value === 'number' 
    ? Math.round(value * 100).toString() 
    : String(value).replace(/\D/g, '')

  // Preenchimento de zeros à esquerda se necessário
  if (v.length < 3) v = v.padStart(3, '0')

  // Transforma "150050" em "1.500,50"
  const inteiro = v.slice(0, -2).replace(/^0+(?=\d)/, '') // Remove zeros à esquerda do inteiro
  const centavos = v.slice(-2)

  const resultado = (inteiro || '0') + ',' + centavos
  
  // Adiciona o ponto de milhar
  return resultado.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}


export const maskIE = (value = '') => {
  const v = onlyNumbers(value).slice(0, 12)

  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
}
