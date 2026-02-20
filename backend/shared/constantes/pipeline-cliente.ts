// src/constantes/pipeline-cliente.js

export const PIPELINE_CLIENTE = [
  // =========================
  // CADASTRO
  // =========================
  {
    key: 'CLIENTE_CADASTRADO',
    label: 'Cliente cadastrado',
    fase: 'CADASTRO',
    ordem: 1,
    temTela: false,
  },

  // =========================
  // MEDIDA INICIAL
  // =========================
  {
    key: 'AGENDAR_MEDIDA',
    label: 'Agendar medida',
    fase: 'MEDIDA',
    ordem: 2,
    temTela: true,
    disparaComData: 'data_medida',
  },
  {
    key: 'MEDIDA_AGENDADA',
    label: 'Medida agendada',
    fase: 'MEDIDA',
    ordem: 3,
    temTela: false,
  },
  {
    key: 'MEDIDA_REALIZADA',
    label: 'Medida realizada',
    fase: 'MEDIDA',
    ordem: 4,
    temTela: false,
  },

  // =========================
  // ORÇAMENTO
  // =========================
  {
    key: 'CRIAR_ORCAMENTO',
    label: 'Criar orçamento',
    fase: 'ORCAMENTO',
    ordem: 5,
    temTela: true,
  },
  {
    key: 'ORCAMENTO_EM_ANDAMENTO',
    label: 'Orçamento em andamento',
    fase: 'ORCAMENTO',
    ordem: 6,
    temTela: true,
  },
  {
    key: 'ORCAMENTO_ENVIADO',
    label: 'Orçamento enviado',
    fase: 'ORCAMENTO',
    ordem: 7,
    temTela: false,
  },
  {
    key: 'ORCAMENTO_EM_NEGOCIACAO',
    label: 'Orçamento em negociação',
    fase: 'ORCAMENTO',
    ordem: 8,
    temTela: false,
  },
  {
    key: 'ORCAMENTO_APROVADO',
    label: 'Orçamento aprovado',
    fase: 'ORCAMENTO',
    ordem: 9,
    temTela: false,
  },
  {
    key: 'ORCAMENTO_REPROVADO',
    label: 'Orçamento reprovado',
    fase: 'ORCAMENTO',
    ordem: 10,
    temTela: false,
    encerraFluxo: true,
  },

  // =========================
  // VENDA
  // =========================
  {
    key: 'VENDA_FECHADA',
    label: 'Venda fechada',
    fase: 'VENDA',
    ordem: 11,
    temTela: false,
  },

  // =========================
  // CONTRATO
  // =========================
  {
    key: 'CONTRATO_GERADO',
    label: 'Contrato gerado',
    fase: 'CONTRATO',
    ordem: 12,
    temTela: true,
  },

  // =========================
  // MEDIDA FINA
  // =========================
  {
    key: 'AGENDAR_MEDIDA_FINA',
    label: 'Agendar medida fina',
    fase: 'MEDIDA_FINA',
    ordem: 13,
    temTela: true,
    disparaComData: 'data_medida_fina',
  },
  {
    key: 'MEDIDA_FINA_AGENDADA',
    label: 'Medida fina agendada',
    fase: 'MEDIDA_FINA',
    ordem: 14,
    temTela: false,
  },
  {
    key: 'MEDIDA_FINA_REALIZADA',
    label: 'Medida fina realizada',
    fase: 'MEDIDA_FINA',
    ordem: 15,
    temTela: false,
  },

  // =========================
  // PROJETO TÉCNICO
  // =========================
  {
    key: 'PROJETO_TECNICO_EM_ANDAMENTO',
    label: 'Projeto técnico em andamento',
    fase: 'PROJETO',
    ordem: 16,
    temTela: true,
  },
  {
    key: 'PROJETO_TECNICO_APROVADO',
    label: 'Projeto técnico aprovado',
    fase: 'PROJETO',
    ordem: 17,
    temTela: false,
  },

  // =========================
  // PLANO DE CORTE (MARCO)
  // =========================
  {
    key: 'PLANO_DE_CORTE',
    label: 'Plano de corte',
    fase: 'PRODUCAO',
    ordem: 18,
    temTela: false,
  },

  // =========================
  // PRODUÇÃO
  // =========================
  {
    key: 'PRODUCAO_AGENDADA',
    label: 'Produção agendada',
    fase: 'PRODUCAO',
    ordem: 19,
    temTela: false,
    disparaComData: 'data_producao',
  },
  {
    key: 'EM_PRODUCAO',
    label: 'Em produção',
    fase: 'PRODUCAO',
    ordem: 20,
    temTela: false,
  },
  {
    key: 'PRODUCAO_FINALIZADA',
    label: 'Produção finalizada',
    fase: 'PRODUCAO',
    ordem: 21,
    temTela: false,
  },

  // =========================
  // MONTAGEM
  // =========================
  {
    key: 'AGENDAR_MONTAGEM',
    label: 'Agendar montagem',
    fase: 'MONTAGEM',
    ordem: 22,
    temTela: true,
    disparaComData: 'data_montagem',
  },
  {
    key: 'MONTAGEM_AGENDADA',
    label: 'Montagem agendada',
    fase: 'MONTAGEM',
    ordem: 23,
    temTela: false,
  },
  {
    key: 'EM_MONTAGEM',
    label: 'Em montagem',
    fase: 'MONTAGEM',
    ordem: 24,
    temTela: false,
  },
  {
    key: 'MONTAGEM_FINALIZADA',
    label: 'Montagem finalizada',
    fase: 'MONTAGEM',
    ordem: 25,
    temTela: false,
  },

  // =========================
  // PÓS-VENDA
  // =========================
  {
    key: 'GARANTIA',
    label: 'Garantia',
    fase: 'POS_VENDA',
    ordem: 26,
    temTela: true,
  },
  {
    key: 'ASSISTENCIA',
    label: 'Assistência',
    fase: 'POS_VENDA',
    ordem: 27,
    temTela: true,
  },
  {
    key: 'MANUTENCAO',
    label: 'Manutenção',
    fase: 'POS_VENDA',
    ordem: 28,
    temTela: true,
  },

  {
    key: 'ENCERRADO',
    label: 'Encerrado',
    fase: 'FINAL',
    ordem: 29,
    temTela: false,
  },
]
