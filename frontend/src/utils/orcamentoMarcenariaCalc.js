export const MODULE_TYPES = [
  'Armario inferior',
  'Armario superior',
  'Torre',
  'Guarda-roupa',
  'Painel',
]

export const MDF_COLORS = [
  { id: 'branco', nome: 'Branco', custo_m2: 66.9, categoria: 'Essencial' },
  { id: 'cinza', nome: 'Cinza', custo_m2: 90.0, categoria: 'Designer' },
  { id: 'azul', nome: 'Azul', custo_m2: 123.54, categoria: 'Premium' },
  { id: 'amadeirado', nome: 'Amadeirado', custo_m2: 180.0, categoria: 'Premium' },
]

export const DEFAULT_MARKUP = 2.5
export const FATOR_FRENTE = 0.35

function round2(v) {
  return Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100
}

function round3(v) {
  return Math.round((Number(v || 0) + Number.EPSILON) * 1000) / 1000
}

export function calcAreaTotalM2(larguraCm, alturaCm) {
  const l = Number(larguraCm || 0)
  const a = Number(alturaCm || 0)
  if (l <= 0 || a <= 0) return 0
  return round3((l / 100) * (a / 100))
}

export function calcAreaFrenteM2(areaTotalM2) {
  return round3(Number(areaTotalM2 || 0) * FATOR_FRENTE)
}

export function calcCustoItem({ larguraCm, alturaCm, custoM2Branco, custoM2Cor }) {
  const areaTotalM2 = calcAreaTotalM2(larguraCm, alturaCm)
  const areaFrenteM2 = calcAreaFrenteM2(areaTotalM2)

  const custoEstrutura = Number(areaTotalM2) * Number(custoM2Branco || 0)
  const custoFrente = Number(areaFrenteM2) * Number(custoM2Cor || 0)
  const custoTotal = round2(custoEstrutura + custoFrente)

  return {
    areaTotalM2,
    areaFrenteM2,
    custoEstrutura: round2(custoEstrutura),
    custoFrente: round2(custoFrente),
    custoTotal,
  }
}

export function calcPrecoVenda(custoTotal, markup) {
  return round2(Number(custoTotal || 0) * Number(markup || 0))
}

export function currencyBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}
