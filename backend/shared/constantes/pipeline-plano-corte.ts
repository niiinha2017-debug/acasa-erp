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
  },
  {
    key: 'FINALIZADO',
    label: 'Finalizado',
    fase: 'PRODUCAO',
    ordem: 3,
    temTela: false,
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
  },
]
