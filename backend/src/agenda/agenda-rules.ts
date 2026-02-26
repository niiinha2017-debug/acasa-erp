export const SETORES_DESTINO = ['LOJA', 'FABRICA'] as const;
export const ORIGENS_FLUXO = [
  'PLANO_CORTE',
  'VENDA_PLANO_CORTE',
  'LOJA_VENDA',
  'POS_VENDA',
  'TAREFA',
] as const;

export type SetorDestino = (typeof SETORES_DESTINO)[number];
export type OrigemFluxo = (typeof ORIGENS_FLUXO)[number];

const ORIGENS_POR_SETOR: Record<SetorDestino, OrigemFluxo[]> = {
  LOJA: ['LOJA_VENDA', 'POS_VENDA', 'TAREFA'],
  FABRICA: ['PLANO_CORTE', 'VENDA_PLANO_CORTE', 'LOJA_VENDA', 'TAREFA'],
};

export function normalizarSetorDestino(
  valor?: string | null,
): SetorDestino | null {
  const key = String(valor || '')
    .trim()
    .toUpperCase();
  if (key === 'LOJA') return 'LOJA';
  if (key === 'FABRICA' || key === 'PRODUCAO') return 'FABRICA';
  return null;
}

export function normalizarOrigemFluxo(
  valor?: string | null,
): OrigemFluxo | null {
  const key = String(valor || '')
    .trim()
    .toUpperCase();
  if ((ORIGENS_FLUXO as readonly string[]).includes(key))
    return key as OrigemFluxo;
  return null;
}

export function origemPermitidaNoSetor(
  setor: SetorDestino,
  origem: OrigemFluxo,
): boolean {
  return ORIGENS_POR_SETOR[setor].includes(origem);
}
