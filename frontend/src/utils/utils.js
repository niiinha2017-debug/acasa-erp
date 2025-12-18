/* =====================
   HELPERS
===================== */
export function onlyNumbers(v = '') {
  return v.replace(/\D/g, '')
}

/* =====================
   MÁSCARAS
===================== */
export function maskCPF(v = '') {
  const n = onlyNumbers(v).slice(0, 11)
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCNPJ(v = '') {
  const n = onlyNumbers(v).slice(0, 14)
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function maskTelefone(v = '') {
  const n = onlyNumbers(v).slice(0, 11)
  if (n.length <= 10)
    return n.replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
  return n.replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCEP(v = '') {
  const n = onlyNumbers(v).slice(0, 8)
  return n.replace(/(\d{5})(\d)/, '$1-$2')
}

/* =====================
   CEP
===================== */
export async function buscarCep(cep) {
  const n = onlyNumbers(cep)
  if (n.length !== 8) return null

  const res = await fetch(`https://viacep.com.br/ws/${n}/json`)
  const data = await res.json()
  if (data.erro) return null

  return data
}
export function maskRG(value = '') {
  const v = value.replace(/\D/g, '')

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
export function maskMoneyBR(value = '') {
  let v = value.replace(/\D/g, '')

  if (!v) return ''

  v = (Number(v) / 100).toFixed(2)

  return v
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
export function moneyBRToNumber(value = '') {
  if (!value) return null

  return Number(
    value
      .replace(/\./g, '')
      .replace(',', '.')
  )
}

