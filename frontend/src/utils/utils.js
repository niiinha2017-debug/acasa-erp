/* =====================
   CEP
===================== */
export async function buscarCep(cep) {
  const n = cep.replace(/\D/g, '') // Garante que só tenha números
  if (n.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${n}/json`)
    const data = await res.json()
    return data.erro ? null : data
  } catch (err) {
    return null
  }
}

export async function buscarCnpj(cnpj) {
  const limpo = String(cnpj || '').replace(/\D/g, '')
  if (limpo.length !== 14) return null

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`)
    if (!res.ok) return null
    const data = await res.json()

    const s = (x) => String(x ?? '').trim()

    return {
      razao_social: s(data.razao_social),
      nome_fantasia: s(data.nome_fantasia),
      telefone: s(data.ddd_telefone_1 || data.ddd_telefone_2),
      cep: s(data.cep),
      endereco: s(data.logradouro),
      numero: s(data.numero),
      bairro: s(data.bairro),
      cidade: s(data.municipio),
      estado: s(data.uf),
      // IE: BrasilAPI pode não ter esse campo; deixa seguro
      ie: s(data.inscricao_estadual),
    }
  } catch {
    return null
  }
}

export const calcularCustoHora = (salario) => {
  if (!salario || salario <= 0) return 0
  // Cálculo padrão: Salário / 220 horas
  return parseFloat((salario / 220).toFixed(2))
}


