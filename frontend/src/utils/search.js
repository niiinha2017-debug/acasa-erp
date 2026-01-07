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
export function buscarFornecedor(lista = [], texto = '') {
  const termo = texto.toLowerCase().trim()
  if (!termo) return lista

  return lista.filter(f =>
    f.razao_social?.toLowerCase().includes(termo) ||
    f.nome_fantasia?.toLowerCase().includes(termo) ||
    f.cnpj?.includes(termo)
  )
}


