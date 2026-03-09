// Mesmas etapas da agenda de produção (pipeline-producao): alinhado à Agenda da Fábrica.
const PIPELINE_PLANO_CORTE_FASES = [
  {
    ordem: 1,
    fase: 'INICIO',
    label: 'Produção Recebida',
    cor: '#94a3b8',
    statusInternos: ['PRODUCAO_RECEBIDA'],
  },
  {
    ordem: 2,
    fase: 'PRODUZINDO',
    label: 'Corte / Usinagem',
    cor: '#f59e0b',
    statusInternos: ['CORTE'],
  },
  {
    ordem: 3,
    fase: 'FIM',
    label: 'Produção Finalizada',
    cor: '#10b981',
    statusInternos: ['PRODUCAO_FINALIZADA'],
  },
];

export { PIPELINE_PLANO_CORTE_FASES as PIPELINE_PLANO_CORTE };

/** Opções para dropdown e exibição (key, label, badgeClass, dotClass), mesmo texto da agenda de produção. */
const BADGE_BY_FASE: Record<number, { badgeClass: string; dotClass: string }> = {
  1: { badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200', dotClass: 'bg-slate-500' },
  2: { badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200', dotClass: 'bg-amber-500' },
  3: { badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dotClass: 'bg-emerald-500' },
};
export const PIPELINE_PLANO_CORTE_OPTIONS = PIPELINE_PLANO_CORTE_FASES.flatMap((f, idx) =>
  (f.statusInternos || []).map((key) => ({
    key,
    label: f.label,
    ...(BADGE_BY_FASE[f.ordem] || BADGE_BY_FASE[1]),
  })),
);