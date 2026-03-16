export const CATEGORIAS_BASE = [
  { label: 'Essencial', value: 'PRIMARIA' },
  { label: 'Design', value: 'SECUNDARIA' },
  { label: 'Premium', value: 'TERCIARIA' },
  { label: 'Insumos', value: 'INSUMO' },
]

export const CATEGORIA_BASE_LABEL = {
  PRIMARIA: 'Essencial',
  SECUNDARIA: 'Design',
  TERCIARIA: 'Premium',
  INSUMO: 'Insumos',
}

export function getCategoriaBaseLabel(value) {
  const key = String(value || '').trim().toUpperCase()
  return CATEGORIA_BASE_LABEL[key] || key || '-'
}
