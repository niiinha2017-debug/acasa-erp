import { onlyNumbers } from './masks'

export function parseBuscaProduto(texto = '') {
  const termos = texto.toLowerCase().split(' ').map(t => t.trim()).filter(Boolean)
  const filtros = { texto: [], unidade: null, quantidade: null, valor: null }

  termos.forEach(t => {
    if (['un', 'm', 'kg', 'cx'].includes(t)) {
      filtros.unidade = t.toUpperCase()
    } else if (onlyNumbers(t)) {
      const n = Number(onlyNumbers(t))
      if (t.includes('.') || t.includes(',')) filtros.valor = n
      else filtros.quantidade = n
    } else {
      filtros.texto.push(t)
    }
  })
  return filtros
}

