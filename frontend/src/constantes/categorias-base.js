export const CATEGORIAS_BASE = [
  { label: 'Essencial', value: 'PRIMARIA' },
  { label: 'Design', value: 'SECUNDARIA' },
  { label: 'Premium', value: 'TERCIARIA' },
]

export const CATEGORIA_BASE_LABEL = {
  PRIMARIA: 'Essencial',
  SECUNDARIA: 'Design',
  TERCIARIA: 'Premium',
}

export function getCategoriaBaseLabel(value) {
  const key = String(value || '').trim().toUpperCase()
  return CATEGORIA_BASE_LABEL[key] || key || '-'
}
