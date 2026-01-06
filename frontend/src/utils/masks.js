// Remove tudo que não é número
export const onlyNumbers = (v = '') => String(v).replace(/\D/g, '')

export const maskCPF = (v = '') => {
  const n = onlyNumbers(v).slice(0, 11)
  return n.replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export const maskCNPJ = (v = '') => {
  const n = onlyNumbers(v).slice(0, 14)
  return n.replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
}

export const maskTelefone = (v = '') => {
  const n = onlyNumbers(v).slice(0, 11)
  if (n.length <= 10)
    return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export const maskCEP = (v = '') => {
  const n = onlyNumbers(v).slice(0, 8)
  return n.replace(/(\d{5})(\d)/, '$1-$2')
}

export const maskMoneyBR = (value = '') => {
  let v = String(value).replace(/\D/g, '')
  if (!v) return ''
  v = (Number(v) / 100).toFixed(2)
  return v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}