// src/constantes/pipeline-producao.js

export const PIPELINE_PRODUCAO = [
  // =========================
  // ABERTURA
  // =========================
  {
    key: 'PRODUCAO_RECEBIDA',
    label: 'Produção recebida',
    fase: 'ABERTURA',
    ordem: 1,
    temTela: false,
  },

  // =========================
  // EXECUÇÃO
  // =========================
  {
    key: 'CORTE',
    label: 'Corte',
    fase: 'EXECUCAO',
    ordem: 2,
    temTela: false,
  },
  {
    key: 'PREPARACAO_TECNICA',
    label: 'Preparação técnica',
    fase: 'EXECUCAO',
    ordem: 3,
    temTela: false,
  },
  {
    key: 'MONTAGEM_INTERNA',
    label: 'Montagem interna',
    fase: 'EXECUCAO',
    ordem: 4,
    temTela: false,
  },
  {
    key: 'ACABAMENTO',
    label: 'Acabamento',
    fase: 'EXECUCAO',
    ordem: 5,
    temTela: false,
  },
  {
    key: 'CONFERENCIA_QUALIDADE',
    label: 'Conferência de qualidade',
    fase: 'EXECUCAO',
    ordem: 6,
    temTela: false,
  },

  // =========================
  // MONTAGEM CLIENTE
  // =========================
  {
    key: 'MONTAGEM_CLIENTE_AGENDADA',
    label: 'Montagem cliente agendada',
    fase: 'MONTAGEM_CLIENTE',
    ordem: 7,
    temTela: true,
    disparaComData: 'data_montagem_cliente',
  },
  {
    key: 'EM_MONTAGEM_CLIENTE',
    label: 'Em montagem cliente',
    fase: 'MONTAGEM_CLIENTE',
    ordem: 8,
    temTela: false,
  },
  {
    key: 'MONTAGEM_CLIENTE_FINALIZADA',
    label: 'Montagem cliente finalizada',
    fase: 'MONTAGEM_CLIENTE',
    ordem: 9,
    temTela: false,
  },

  // =========================
  // FINALIZAÇÃO
  // =========================
  {
    key: 'PRODUCAO_FINALIZADA',
    label: 'Produção finalizada',
    fase: 'FINALIZACAO',
    ordem: 10,
    temTela: false,
  },
];

export const PIPELINE_PRODUCAO_KEYS: string[] = PIPELINE_PRODUCAO.map((p) => p.key);
