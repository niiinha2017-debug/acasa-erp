export const CATEGORIAS_BASE = []

export const CATEGORIA_BASE_LABEL = {}

export const CATS_FERRAGEM = [
  { label: 'Dobradiça', value: 'DOBRADICA' },
  { label: 'Corrediça', value: 'CORREDICA' },
  { label: 'Puxador', value: 'PUXADOR' },
  { label: 'Fechadura', value: 'FECHADURA' },
  { label: 'Suporte', value: 'SUPORTE' },
  { label: 'Amortecedor', value: 'AMORTECEDOR' },
  { label: 'Outro', value: 'OUTRO' },
]

export const CATS_FERRAGEM_LABEL = {
  DOBRADICA: 'Dobradiça',
  CORREDICA: 'Corrediça',
  PUXADOR: 'Puxador',
  FECHADURA: 'Fechadura',
  SUPORTE: 'Suporte',
  AMORTECEDOR: 'Amortecedor',
  OUTRO: 'Outro',
}

export function getCategoriaBaseLabel(value) {
  const key = String(value || '').trim().toUpperCase()
  return CATEGORIA_BASE_LABEL[key] || key || '-'
}

export function getCatFerragemLabel(value) {
  const key = String(value || '').trim().toUpperCase()
  return CATS_FERRAGEM_LABEL[key] || key || '-'
}
