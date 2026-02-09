// src/constantes/pipeline-plano-corte.js

export const PIPELINE_PLANO_CORTE = [
  // =========================
  // ABERTURA
  // =========================
  {
    key: 'EM_ABERTO',
    label: 'Em aberto',
    fase: 'ABERTURA',
    ordem: 1,
    temTela: true, // tela de cadastro/edição do plano
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-100',
    dotClass: 'bg-amber-500',
  },

  // =========================
  // PRODUÇÃO
  // =========================
  {
    key: 'EM_PRODUCAO',
    label: 'Em produção',
    fase: 'PRODUCAO',
    ordem: 2,
    temTela: false,
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100',
    dotClass: 'bg-blue-500',
  },
  {
    key: 'FINALIZADO',
    label: 'Finalizado',
    fase: 'PRODUCAO',
    ordem: 3,
    temTela: false,
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    dotClass: 'bg-emerald-500',
  },

  // =========================
  // FINANCEIRO
  // =========================
  {
    key: 'COMPENSADO',
    label: 'Compensado',
    fase: 'FINANCEIRO',
    ordem: 4,
    temTela: false,
    badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200',
    dotClass: 'bg-slate-500',
  },
]
