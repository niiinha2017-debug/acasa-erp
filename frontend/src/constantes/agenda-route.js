import { can } from '@/services/permissions'

export const AGENDA_ROUTE_PATH = '/agenda-geral'

export const AGENDA_VIEW = {
  GERAL: 'geral',
  FABRICA: 'fabrica',
  LOJA: 'loja',
}

export const AGENDA_ROUTE_PERMISSIONS = [
  'agendamentos.ver',
  'agendamentos.vendas',
  'agendamentos.producao',
]

export function hasAgendaAccess() {
  return AGENDA_ROUTE_PERMISSIONS.some((perm) => can(perm))
}

export function resolveAgendaViewByPermission() {
  if (can('agendamentos.ver')) return AGENDA_VIEW.GERAL
  if (can('agendamentos.producao')) return AGENDA_VIEW.FABRICA
  if (can('agendamentos.vendas')) return AGENDA_VIEW.LOJA
  return AGENDA_VIEW.LOJA
}