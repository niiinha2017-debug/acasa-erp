export const STATUS_FINANCEIRO = [
  { key: 'EM_ABERTO', label: 'Em aberto' },
  { key: 'VENCIDO', label: 'Vencido' },
  { key: 'PAGO', label: 'Pago' },
  { key: 'CANCELADO', label: 'Cancelado' },
] as const

export const STATUS_FINANCEIRO_KEYS = {
  EM_ABERTO: 'EM_ABERTO',
  VENCIDO: 'VENCIDO',
  PAGO: 'PAGO',
  CANCELADO: 'CANCELADO',
} as const
