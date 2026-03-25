// src/constantes/pipeline-producao.js
// Cores e etapas centralizados: cada key tem colorFamily (frontend herda e aplica tom claro → escuro por status).

export const PIPELINE_PRODUCAO = [
  // =========================
  // ABERTURA (Recebimento dos dois canais)
  // =========================
  {
    key: 'PRODUCAO_RECEBIDA',
    label: 'Produção Recebida',
    fase: 'ABERTURA',
    ordem: 1,
    temTela: false,
    badgeClass: 'bg-slate-100 text-slate-700',
    colorFamily: 'indigo',
  },
  {
    key: 'AGENDAR_MEDIDA_FINA',
    label: 'Agendar medida fina',
    fase: 'ABERTURA',
    ordem: 1.2,
    temTela: true,
    badgeClass: 'bg-cyan-50 text-cyan-700',
    colorFamily: 'teal',
  },
  {
    key: 'MEDIDA_FINA',
    label: 'Medida fina agendada',
    fase: 'ABERTURA',
    ordem: 1.3,
    temTela: true,
    badgeClass: 'bg-teal-50 text-teal-700',
    colorFamily: 'teal',
  },
  {
    key: 'AGUARDANDO_PROJETO_TECNICO',
    label: 'Aguardando projeto técnico',
    fase: 'ABERTURA',
    ordem: 1.5,
    temTela: true,
    badgeClass: 'bg-violet-50 text-violet-700',
    colorFamily: 'violet',
  },
  {
    key: 'PROJETO_TECNICO_EM_ANDAMENTO',
    label: 'Projeto técnico em andamento',
    fase: 'EXECUCAO',
    ordem: 1.8,
    temTela: true,
    badgeClass: 'bg-violet-100 text-violet-800',
    colorFamily: 'violet',
  },
  {
    key: 'PROJETO_TECNICO_CONCLUIDO',
    label: 'Projeto técnico concluído',
    fase: 'EXECUCAO',
    ordem: 1.9,
    temTela: false,
    badgeClass: 'bg-emerald-50 text-emerald-700',
    colorFamily: 'violet',
  },

  // =========================
  // PRODUÇÃO (uma etapa só; cálculo de produção já considera corte, montagem interna, acabamento etc.)
  // =========================
  {
    key: 'PRODUCAO_EM_ANDAMENTO',
    label: 'Produção',
    fase: 'EXECUCAO',
    ordem: 2,
    temTela: true,
    badgeClass: 'bg-sky-50 text-sky-700',
    colorFamily: 'sky',
  },
  // Categorias legadas (não usadas no fluxo; mantidas para eventos já gravados)
  { key: 'PREPARACAO_TECNICA', label: 'Preparação Técnica', fase: 'EXECUCAO', ordem: 2.1, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'CORTE', label: 'Corte / Usinagem', fase: 'EXECUCAO', ordem: 2.2, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'MONTAGEM_INTERNA', label: 'Montagem Interna', fase: 'EXECUCAO', ordem: 2.3, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'ACABAMENTO', label: 'Acabamento', fase: 'EXECUCAO', ordem: 2.4, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'CONFERENCIA_QUALIDADE', label: 'Conferência de Qualidade', fase: 'EXECUCAO', ordem: 2.5, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },

  // =========================
  // LOGÍSTICA / MONTAGEM EXTERNA
  // =========================
  {
    key: 'MONTAGEM_CLIENTE_AGENDADA',
    label: 'Montagem Cliente Agendada',
    fase: 'MONTAGEM_CLIENTE',
    ordem: 7,
    temTela: true,
    disparaComData: 'data_montagem_cliente',
    badgeClass: 'bg-amber-50 text-amber-700',
    colorFamily: 'amber',
  },
  {
    key: 'EM_MONTAGEM_CLIENTE',
    label: 'Em Montagem Cliente',
    fase: 'MONTAGEM_CLIENTE',
    ordem: 8,
    temTela: false,
    badgeClass: 'bg-orange-100 text-orange-800',
    colorFamily: 'amber',
  },
  {
    key: 'MONTAGEM_CLIENTE_FINALIZADA',
    label: 'Montagem Cliente Finalizada',
    fase: 'MONTAGEM_CLIENTE',
    ordem: 9,
    temTela: false,
    badgeClass: 'bg-emerald-100 text-emerald-800',
    colorFamily: 'amber',
  },

  // =========================
  // PÓS-VENDA (Agendamentos e Encerramento – tarefa avulsa)
  // =========================
  {
    key: 'AGENDAR_POS_VENDA',
    label: 'Agendar Pós-Venda',
    fase: 'POS_VENDA',
    ordem: 10,
    temTela: true,
    disparaComData: 'data_visita_pos_venda',
    badgeClass: 'bg-pink-50 text-pink-700',
    colorFamily: 'slate',
  },
  { key: 'GARANTIA', label: 'Garantia', fase: 'POS_VENDA', ordem: 10.1, temTela: true, badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  { key: 'MANUTENCAO', label: 'Manutenção', fase: 'POS_VENDA', ordem: 10.2, temTela: true, badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  { key: 'ASSISTENCIA', label: 'Assistência', fase: 'POS_VENDA', ordem: 10.3, temTela: true, badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  {
    key: 'PRODUCAO_FINALIZADA',
    label: 'Produção Finalizada',
    fase: 'FINALIZACAO',
    ordem: 11,
    temTela: false,
    badgeClass: 'bg-green-500 text-white',
    colorFamily: 'indigo',
  },
];

export const PIPELINE_PRODUCAO_KEYS = PIPELINE_PRODUCAO.map((p) => p.key);

// =============================================================================
// Regras de visibilidade da Agenda de Produção (fonte única – backend e frontend)
// =============================================================================
// Eventos com estas categorias e status PENDENTE aparecem SOMENTE no painel do topo
// ("Medidas a serem agendadas"). No calendário aparecem quando agendados ou concluídos.
export const AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS = ['AGENDAR_MEDIDA_FINA'] as const;

/** Status que, quando combinado com AGENDAR_MEDIDA_FINA, faz o evento aparecer no calendário (medida fina agendada). */
export const AGENDA_FABRICA_STATUS_AGENDADO = 'EM_ANDAMENTO';

/** Eventos CONCLUIDO sempre aparecem no calendário (histórico: ex. dia em que foi feita a medida fina). */
export const AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL = 'CONCLUIDO';