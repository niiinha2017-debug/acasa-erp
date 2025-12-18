import { onlyNumbers } from './utils'

/* =====================
   BUSCA INTELIGENTE (GENÉRICA)
===================== */
export function parseBuscaInteligente(texto = '') {
  const termos = texto
    .toLowerCase()
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean)

  const filtros = {
    texto: [],
    status: null,
    tipo: null,
  }

  termos.forEach(t => {
    // status
    if (['pago', 'em_aberto', 'aberto', 'atrasado'].includes(t)) {
      filtros.status =
        t === 'aberto' ? 'EM_ABERTO' : t.toUpperCase()
      return
    }

    // tipo
    if (['loja', 'fabrica', 'fábrica'].includes(t)) {
      filtros.tipo = t === 'fábrica' ? 'FABRICA' : t.toUpperCase()
      return
    }

    filtros.texto.push(t)
  })

  return filtros
}

/* =====================
   BUSCA FORNECEDORES
===================== */
export function parseBuscaFornecedor(texto = '') {
  const termos = texto
    .toLowerCase()
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean)

  const filtros = {
    texto: [],
    status: null,
    dia_fechamento: null,
    cnpj: null,
  }

  termos.forEach(t => {
    // status
    if (['ativo', 'inativo'].includes(t)) {
      filtros.status = t.toUpperCase()
      return
    }

    // dia de fechamento
    if (/^\d{1,2}$/.test(t)) {
      filtros.dia_fechamento = Number(t)
      return
    }

    // CNPJ
    const nums = onlyNumbers(t)
    if (nums.length === 14) {
      filtros.cnpj = nums
      return
    }

    filtros.texto.push(t)
  })

  return filtros
}
/* =====================
   BUSCA PRODUTOS
===================== */
export function parseBuscaProduto(texto = '') {
  const termos = texto
    .toLowerCase()
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean)

  const filtros = {
    texto: [],
    unidade: null,
    quantidade: null,
    valor: null,
  }

  termos.forEach(t => {
    // unidade (ex: un, m, m2, kg)
    if (['un', 'm', 'm2', 'm3', 'kg', 'cx'].includes(t)) {
      filtros.unidade = t.toUpperCase()
      return
    }

    // números (quantidade ou valor)
    const nums = onlyNumbers(t)
    if (nums) {
      const n = Number(nums)

      // valor monetário (ex: 12, 12.50, 100)
      if (t.includes('.') || t.includes(',')) {
        filtros.valor = n
        return
      }

      // quantidade simples
      filtros.quantidade = n
      return
    }

    // texto livre (nome / fornecedor)
    filtros.texto.push(t)
  })

  return filtros
}
export function parseBuscaPlanoCorte(texto = '') {
  const termos = texto
    .toLowerCase()
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean)

  const filtros = {
    texto: [],
    status: null,
    data: null
  }

  termos.forEach(t => {
    // status
    if (['rascunho', 'emproducao', 'finalizado', 'cancelado'].includes(t)) {
      filtros.status =
        t === 'emproducao' ? 'EmProducao' : t.charAt(0).toUpperCase() + t.slice(1)
      return
    }

    // data simples
    if (/^\d{1,2}\/\d{1,2}/.test(t)) {
      filtros.data = t
      return
    }

    filtros.texto.push(t)
  })

  return filtros
}
