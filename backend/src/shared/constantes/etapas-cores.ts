/**
 * Fonte única de etapas do fluxo e classes Tailwind por etapa/status.
 * Frontend consome via GET /utils/status-colors e aplica as classes.
 *
 * Tabela Passo | Processo | Cor Tailwind | Motivação
 * 1 Cadastro slate Neutro (Início)
 * 2 Medição blue Técnico / Frio
 * 3 Orçamento amber Comercial / Valor
 * 4 Apresentação indigo Reunião / Foco
 * 5 Fechar Venda emerald Sucesso / Dinheiro
 * 6 Agendar Fechamento lime Transição / Natureza
 * 7 Medida Fina purple Precisão / Nobre
 * 8 Projeto Técnico pink Criatividade / Detalhe
 * 9 Produção orange Energia / Fábrica
 * 10 Montagem cyan Limpeza / Entrega
 * 11 Pós-Venda fuchsia Relacionamento / Cuidado
 */

export const ETAPA_KEYS = [
  'CADASTRO',
  'MEDICAO',
  'ORCAMENTO',
  'AGENDAR_APRESENTACAO',
  'FECHAR_VENDA',
  'AGENDAR_FECHAMENTO',
  'MEDIDA_FINA',
  'PROJETO_TECNICO',
  'PRODUCAO',
  'MONTAGEM',
  'POS_VENDA_GARANTIA',
] as const;

export const CATEGORIAS_PROJETO_TECNICO = [
  'AGUARDANDO_PROJETO_TECNICO',
  'PROJETO_TECNICO_EM_ANDAMENTO',
  'PROJETO_TECNICO_CONCLUIDO',
  'PROJETO_TECNICO_APROVADO',
];

/** Mapeia categoria (agenda/status) para a chave da etapa oficial. */
export const CATEGORIA_TO_ETAPA_KEY: Record<string, string> = {
  CADASTRO: 'CADASTRO',
  CLIENTE_CADASTRADO: 'CADASTRO',
  MEDICAO_VENDA: 'MEDICAO',
  MEDIDA: 'MEDICAO',
  AGENDAR_MEDIDA: 'MEDICAO',
  MEDIDA_AGENDADA: 'MEDICAO',
  MEDIDA_EM_ANDAMENTO: 'MEDICAO',
  MEDIDA_REALIZADA: 'MEDICAO',
  MEDIDA_VENDA_REALIZADA: 'MEDICAO',
  ORCAMENTO: 'ORCAMENTO',
  CRIAR_ORCAMENTO: 'ORCAMENTO',
  ORCAMENTO_EM_ANDAMENTO: 'ORCAMENTO',
  ORCAMENTO_ENVIADO: 'ORCAMENTO',
  ORCAMENTO_APROVADO: 'ORCAMENTO',
  APRESENTACAO: 'AGENDAR_APRESENTACAO',
  AGENDAR_APRESENTACAO: 'AGENDAR_APRESENTACAO',
  APRESENTACAO_AGENDADA: 'AGENDAR_APRESENTACAO',
  ORCAMENTO_APRESENTADO: 'AGENDAR_APRESENTACAO',
  CONTRATO: 'FECHAR_VENDA',
  CONTRATO_GERADO: 'FECHAR_VENDA',
  VENDA_FECHADA: 'FECHAR_VENDA',
  CONTRATO_ASSINADO: 'FECHAR_VENDA',
  AGENDAR_FECHAMENTO: 'AGENDAR_FECHAMENTO',
  MEDIDA_FINA: 'MEDIDA_FINA',
  AGENDAR_MEDIDA_FINA: 'MEDIDA_FINA',
  MEDIDA_FINA_AGENDADA: 'MEDIDA_FINA',
  MEDIDA_FINA_REALIZADA: 'MEDIDA_FINA',
  PRODUCAO_RECEBIDA: 'PRODUCAO',
  CORTE: 'PRODUCAO',
  PREPARACAO_TECNICA: 'PRODUCAO',
  MONTAGEM_INTERNA: 'PRODUCAO',
  ACABAMENTO: 'PRODUCAO',
  CONFERENCIA_QUALIDADE: 'PRODUCAO',
  AGUARDANDO_PROJETO_TECNICO: 'PROJETO_TECNICO',
  PROJETO_TECNICO_EM_ANDAMENTO: 'PROJETO_TECNICO',
  PROJETO_TECNICO_CONCLUIDO: 'PROJETO_TECNICO',
  PROJETO_TECNICO_APROVADO: 'PROJETO_TECNICO',
  PRODUCAO_AGENDADA: 'PRODUCAO',
  EM_PRODUCAO: 'PRODUCAO',
  PRODUCAO_FINALIZADA: 'PRODUCAO',
  MONTAGEM_CLIENTE_AGENDADA: 'MONTAGEM',
  MONTAGEM_AGENDADA: 'MONTAGEM',
  EM_MONTAGEM_CLIENTE: 'MONTAGEM',
  EM_MONTAGEM: 'MONTAGEM',
  MONTAGEM_CLIENTE_FINALIZADA: 'MONTAGEM',
  MONTAGEM_FINALIZADA: 'MONTAGEM',
  GARANTIA: 'POS_VENDA_GARANTIA',
  ASSISTENCIA: 'POS_VENDA_GARANTIA',
  MANUTENCAO: 'POS_VENDA_GARANTIA',
  ENCERRADO: 'POS_VENDA_GARANTIA',
  PRODUCAO_MONTAGEM: 'PRODUCAO',
};

/** Etapas oficiais (ordem, key, label) para listagem/stepper. */
export const ETAPAS_OFICIAL = ETAPA_KEYS.map((key, i) => ({
  ordem: i + 1,
  key,
  label:
    key === 'CADASTRO'
      ? 'Cadastro'
      : key === 'MEDICAO'
        ? 'Medição'
        : key === 'ORCAMENTO'
          ? 'Orçamento'
          : key === 'AGENDAR_APRESENTACAO'
            ? 'Agendar Apresentação'
            : key === 'FECHAR_VENDA'
              ? 'Fechar Venda'
              : key === 'AGENDAR_FECHAMENTO'
                ? 'Agendar Fechamento'
                : key === 'MEDIDA_FINA'
                  ? 'Medida Fina'
                  : key === 'PROJETO_TECNICO'
                    ? 'Projeto Técnico'
                    : key === 'PRODUCAO'
                      ? 'Produção'
                      : key === 'MONTAGEM'
                        ? 'Montagem'
                        : 'Pós-Venda/Garantia',
}));

/** Classes Tailwind por etapa (borda esquerda, badge, dot, etc.). */
const BORDA_ESQUERDA: Record<string, string> = {
  CADASTRO: 'border-l-8 border-slate-400',
  MEDICAO: 'border-l-8 border-blue-500',
  ORCAMENTO: 'border-l-8 border-amber-500',
  AGENDAR_APRESENTACAO: 'border-l-8 border-indigo-500',
  FECHAR_VENDA: 'border-l-8 border-emerald-500',
  AGENDAR_FECHAMENTO: 'border-l-8 border-lime-600',
  MEDIDA_FINA: 'border-l-8 border-purple-500',
  PROJETO_TECNICO: 'border-l-8 border-pink-500',
  PRODUCAO: 'border-l-8 border-orange-500',
  MONTAGEM: 'border-l-8 border-cyan-500',
  POS_VENDA_GARANTIA: 'border-l-8 border-fuchsia-500',
};

const BADGE_TEMPO: Record<string, string> = {
  CADASTRO: 'bg-slate-400/10 text-slate-400',
  MEDICAO: 'bg-blue-500/10 text-blue-500',
  ORCAMENTO: 'bg-amber-500/10 text-amber-500',
  AGENDAR_APRESENTACAO: 'bg-indigo-500/10 text-indigo-500',
  FECHAR_VENDA: 'bg-emerald-500/10 text-emerald-500',
  AGENDAR_FECHAMENTO: 'bg-lime-600/10 text-lime-600',
  MEDIDA_FINA: 'bg-purple-500/10 text-purple-500',
  PROJETO_TECNICO: 'bg-pink-500/10 text-pink-500',
  PRODUCAO: 'bg-orange-500/10 text-orange-500',
  MONTAGEM: 'bg-cyan-500/10 text-cyan-500',
  POS_VENDA_GARANTIA: 'bg-fuchsia-500/10 text-fuchsia-500',
};

const DOT: Record<string, string> = {
  CADASTRO: 'bg-slate-400',
  MEDICAO: 'bg-blue-500',
  ORCAMENTO: 'bg-amber-500',
  AGENDAR_APRESENTACAO: 'bg-indigo-500',
  FECHAR_VENDA: 'bg-emerald-500',
  AGENDAR_FECHAMENTO: 'bg-lime-600',
  MEDIDA_FINA: 'bg-purple-500',
  PROJETO_TECNICO: 'bg-pink-500',
  PRODUCAO: 'bg-orange-500',
  MONTAGEM: 'bg-cyan-500',
  POS_VENDA_GARANTIA: 'bg-fuchsia-500',
};

const HOVER_BG: Record<string, string> = {
  CADASTRO: 'hover:bg-slate-50',
  MEDICAO: 'hover:bg-blue-50',
  ORCAMENTO: 'hover:bg-amber-50',
  AGENDAR_APRESENTACAO: 'hover:bg-indigo-50',
  FECHAR_VENDA: 'hover:bg-emerald-50',
  AGENDAR_FECHAMENTO: 'hover:bg-lime-50',
  MEDIDA_FINA: 'hover:bg-purple-50',
  PROJETO_TECNICO: 'hover:bg-pink-50',
  PRODUCAO: 'hover:bg-orange-50',
  MONTAGEM: 'hover:bg-cyan-50',
  POS_VENDA_GARANTIA: 'hover:bg-fuchsia-50',
};

const BORDER_BOTTOM: Record<string, string> = {
  CADASTRO: 'border-b-4 border-slate-400',
  MEDICAO: 'border-b-4 border-blue-500',
  ORCAMENTO: 'border-b-4 border-amber-500',
  AGENDAR_APRESENTACAO: 'border-b-4 border-indigo-500',
  FECHAR_VENDA: 'border-b-4 border-emerald-500',
  AGENDAR_FECHAMENTO: 'border-b-4 border-lime-600',
  MEDIDA_FINA: 'border-b-4 border-purple-500',
  PROJETO_TECNICO: 'border-b-4 border-pink-500',
  PRODUCAO: 'border-b-4 border-orange-500',
  MONTAGEM: 'border-b-4 border-cyan-500',
  POS_VENDA_GARANTIA: 'border-b-4 border-fuchsia-500',
};

const LINE_BG: Record<string, string> = {
  CADASTRO: '!bg-slate-400',
  MEDICAO: '!bg-blue-500',
  ORCAMENTO: '!bg-amber-500',
  AGENDAR_APRESENTACAO: '!bg-indigo-500',
  FECHAR_VENDA: '!bg-emerald-500',
  AGENDAR_FECHAMENTO: '!bg-lime-600',
  MEDIDA_FINA: '!bg-purple-500',
  PROJETO_TECNICO: '!bg-pink-500',
  PRODUCAO: '!bg-orange-500',
  MONTAGEM: '!bg-cyan-500',
  POS_VENDA_GARANTIA: '!bg-fuchsia-500',
};

const DOT_BORDER: Record<string, string> = {
  CADASTRO: 'border-slate-400',
  MEDICAO: 'border-blue-500',
  ORCAMENTO: 'border-amber-500',
  AGENDAR_APRESENTACAO: 'border-indigo-500',
  FECHAR_VENDA: 'border-emerald-500',
  AGENDAR_FECHAMENTO: 'border-lime-600',
  MEDIDA_FINA: 'border-purple-500',
  PROJETO_TECNICO: 'border-pink-500',
  PRODUCAO: 'border-orange-500',
  MONTAGEM: 'border-cyan-500',
  POS_VENDA_GARANTIA: 'border-fuchsia-500',
};

type StatusTarefa = 'pendente' | 'em_andamento' | 'pausado' | 'concluido';

/** Regra de tons por status da tarefa: pendente 500, em_andamento 600 + pulse, pausado 300, concluído slate-700. */
export const STATUS_SHADES: Record<StatusTarefa, { shade: string; pulse: boolean }> = {
  pendente: { shade: '500', pulse: false },
  em_andamento: { shade: '600', pulse: true },
  pausado: { shade: '300', pulse: false },
  concluido: { shade: '700', pulse: false }, // sempre slate-700
};

const BORDER_L4_BY_STATUS: Record<string, Record<StatusTarefa, string>> = {
  CADASTRO: {
    pendente: 'border-l-4 border-slate-500',
    em_andamento: 'border-l-4 border-slate-600',
    pausado: 'border-l-4 border-slate-300',
    concluido: 'border-l-4 border-slate-700',
  },
  MEDICAO: {
    pendente: 'border-l-4 border-blue-500',
    em_andamento: 'border-l-4 border-blue-600',
    pausado: 'border-l-4 border-blue-300',
    concluido: 'border-l-4 border-slate-700',
  },
  ORCAMENTO: {
    pendente: 'border-l-4 border-amber-500',
    em_andamento: 'border-l-4 border-amber-600',
    pausado: 'border-l-4 border-amber-300',
    concluido: 'border-l-4 border-slate-700',
  },
  AGENDAR_APRESENTACAO: {
    pendente: 'border-l-4 border-indigo-500',
    em_andamento: 'border-l-4 border-indigo-600',
    pausado: 'border-l-4 border-indigo-300',
    concluido: 'border-l-4 border-slate-700',
  },
  FECHAR_VENDA: {
    pendente: 'border-l-4 border-emerald-500',
    em_andamento: 'border-l-4 border-emerald-600',
    pausado: 'border-l-4 border-emerald-300',
    concluido: 'border-l-4 border-slate-700',
  },
  AGENDAR_FECHAMENTO: {
    pendente: 'border-l-4 border-lime-500',
    em_andamento: 'border-l-4 border-lime-600',
    pausado: 'border-l-4 border-lime-300',
    concluido: 'border-l-4 border-slate-700',
  },
  MEDIDA_FINA: {
    pendente: 'border-l-4 border-purple-500',
    em_andamento: 'border-l-4 border-purple-700',
    pausado: 'border-l-4 border-purple-300',
    concluido: 'border-l-4 border-slate-700',
  },
  PROJETO_TECNICO: {
    pendente: 'border-l-4 border-pink-500',
    em_andamento: 'border-l-4 border-pink-600',
    pausado: 'border-l-4 border-pink-300',
    concluido: 'border-l-4 border-slate-700',
  },
  PRODUCAO: {
    pendente: 'border-l-4 border-orange-500',
    em_andamento: 'border-l-4 border-orange-600',
    pausado: 'border-l-4 border-orange-300',
    concluido: 'border-l-4 border-slate-700',
  },
  MONTAGEM: {
    pendente: 'border-l-4 border-cyan-500',
    em_andamento: 'border-l-4 border-cyan-600',
    pausado: 'border-l-4 border-cyan-300',
    concluido: 'border-l-4 border-slate-700',
  },
  POS_VENDA_GARANTIA: {
    pendente: 'border-l-4 border-fuchsia-500',
    em_andamento: 'border-l-4 border-fuchsia-600',
    pausado: 'border-l-4 border-fuchsia-300',
    concluido: 'border-l-4 border-slate-700',
  },
};

const BADGE_TEMPO_BY_STATUS: Record<string, Record<StatusTarefa, string>> = {
  CADASTRO: {
    pendente: 'bg-slate-500/10 text-slate-500',
    em_andamento: 'bg-slate-600/10 text-slate-600',
    pausado: 'bg-slate-300/10 text-slate-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  MEDICAO: {
    pendente: 'bg-blue-500/10 text-blue-500',
    em_andamento: 'bg-blue-600/10 text-blue-600',
    pausado: 'bg-blue-300/10 text-blue-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  ORCAMENTO: {
    pendente: 'bg-amber-500/10 text-amber-500',
    em_andamento: 'bg-amber-600/10 text-amber-600',
    pausado: 'bg-amber-300/10 text-amber-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  AGENDAR_APRESENTACAO: {
    pendente: 'bg-indigo-500/10 text-indigo-500',
    em_andamento: 'bg-indigo-600/10 text-indigo-600',
    pausado: 'bg-indigo-300/10 text-indigo-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  FECHAR_VENDA: {
    pendente: 'bg-emerald-500/10 text-emerald-500',
    em_andamento: 'bg-emerald-600/10 text-emerald-600',
    pausado: 'bg-emerald-300/10 text-emerald-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  AGENDAR_FECHAMENTO: {
    pendente: 'bg-lime-500/10 text-lime-500',
    em_andamento: 'bg-lime-600/10 text-lime-600',
    pausado: 'bg-lime-300/10 text-lime-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  MEDIDA_FINA: {
    pendente: 'bg-purple-500/10 text-purple-500',
    em_andamento: 'bg-purple-600/10 text-purple-600',
    pausado: 'bg-purple-300/10 text-purple-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  PROJETO_TECNICO: {
    pendente: 'bg-pink-500/10 text-pink-500',
    em_andamento: 'bg-pink-600/10 text-pink-600',
    pausado: 'bg-pink-300/10 text-pink-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  PRODUCAO: {
    pendente: 'bg-orange-500/10 text-orange-500',
    em_andamento: 'bg-orange-600/10 text-orange-600',
    pausado: 'bg-orange-300/10 text-orange-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  MONTAGEM: {
    pendente: 'bg-cyan-500/10 text-cyan-500',
    em_andamento: 'bg-cyan-700/10 text-cyan-700',
    pausado: 'bg-cyan-300/10 text-cyan-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
  POS_VENDA_GARANTIA: {
    pendente: 'bg-fuchsia-500/10 text-fuchsia-500',
    em_andamento: 'bg-fuchsia-600/10 text-fuchsia-600',
    pausado: 'bg-fuchsia-300/10 text-fuchsia-300',
    concluido: 'bg-slate-700/10 text-slate-700',
  },
};

const DOT_BY_STATUS: Record<string, Record<StatusTarefa, string>> = {
  CADASTRO: {
    pendente: 'bg-slate-500',
    em_andamento: 'bg-slate-700',
    pausado: 'bg-slate-300',
    concluido: 'bg-slate-700',
  },
  MEDICAO: {
    pendente: 'bg-blue-500',
    em_andamento: 'bg-blue-600',
    pausado: 'bg-blue-300',
    concluido: 'bg-slate-700',
  },
  ORCAMENTO: {
    pendente: 'bg-amber-500',
    em_andamento: 'bg-amber-700',
    pausado: 'bg-amber-300',
    concluido: 'bg-slate-700',
  },
  AGENDAR_APRESENTACAO: {
    pendente: 'bg-indigo-500',
    em_andamento: 'bg-indigo-600',
    pausado: 'bg-indigo-300',
    concluido: 'bg-slate-700',
  },
  FECHAR_VENDA: {
    pendente: 'bg-emerald-500',
    em_andamento: 'bg-emerald-600',
    pausado: 'bg-emerald-300',
    concluido: 'bg-slate-700',
  },
  AGENDAR_FECHAMENTO: {
    pendente: 'bg-lime-500',
    em_andamento: 'bg-lime-700',
    pausado: 'bg-lime-300',
    concluido: 'bg-slate-700',
  },
  MEDIDA_FINA: {
    pendente: 'bg-purple-500',
    em_andamento: 'bg-purple-600',
    pausado: 'bg-purple-300',
    concluido: 'bg-slate-700',
  },
  PROJETO_TECNICO: {
    pendente: 'bg-pink-500',
    em_andamento: 'bg-pink-600',
    pausado: 'bg-pink-300',
    concluido: 'bg-slate-700',
  },
  PRODUCAO: {
    pendente: 'bg-orange-500',
    em_andamento: 'bg-orange-600',
    pausado: 'bg-orange-300',
    concluido: 'bg-slate-700',
  },
  MONTAGEM: {
    pendente: 'bg-cyan-500',
    em_andamento: 'bg-cyan-600',
    pausado: 'bg-cyan-300',
    concluido: 'bg-slate-700',
  },
  POS_VENDA_GARANTIA: {
    pendente: 'bg-fuchsia-500',
    em_andamento: 'bg-fuchsia-600',
    pausado: 'bg-fuchsia-300',
    concluido: 'bg-slate-700',
  },
};

const VENDAS_ETAPA_KEYS = [
  'CADASTRO',
  'MEDICAO',
  'ORCAMENTO',
  'AGENDAR_APRESENTACAO',
  'FECHAR_VENDA',
  'AGENDAR_FECHAMENTO',
];

const PRODUCAO_ETAPA_KEYS = [
  'MEDIDA_FINA',
  'PROJETO_TECNICO',
  'PRODUCAO',
  'MONTAGEM',
  'POS_VENDA_GARANTIA',
];

type StatusExecucao = 'agendado' | 'em_andamento' | 'concluido';

/** Calendário agenda vendas: mesmo tons do fluxo — pendente 500, em_andamento 600, pausado 300, concluido slate-700. */
const CALENDAR_EVENT_VENDAS: Record<string, Record<string, string>> = {
  CADASTRO: {
    pendente: 'bg-slate-500 hover:bg-slate-600',
    em_andamento: 'bg-slate-600 hover:bg-slate-500',
    pausado: 'bg-slate-300 hover:bg-slate-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  MEDICAO: {
    pendente: 'bg-blue-500 hover:bg-blue-600',
    em_andamento: 'bg-blue-600 hover:bg-blue-500',
    pausado: 'bg-blue-300 hover:bg-blue-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  ORCAMENTO: {
    pendente: 'bg-amber-500 hover:bg-amber-600',
    em_andamento: 'bg-amber-600 hover:bg-amber-500',
    pausado: 'bg-amber-300 hover:bg-amber-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  AGENDAR_APRESENTACAO: {
    pendente: 'bg-indigo-500 hover:bg-indigo-600',
    em_andamento: 'bg-indigo-600 hover:bg-indigo-500',
    pausado: 'bg-indigo-300 hover:bg-indigo-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  FECHAR_VENDA: {
    pendente: 'bg-emerald-500 hover:bg-emerald-600',
    em_andamento: 'bg-emerald-600 hover:bg-emerald-500',
    pausado: 'bg-emerald-300 hover:bg-emerald-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  AGENDAR_FECHAMENTO: {
    pendente: 'bg-lime-500 hover:bg-lime-600',
    em_andamento: 'bg-lime-600 hover:bg-lime-500',
    pausado: 'bg-lime-300 hover:bg-lime-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
};

/** Calendário agenda produção: mesmo tons — pendente 500, em_andamento 600, pausado 300, concluido slate-700. */
const CALENDAR_EVENT_PRODUCAO: Record<string, Record<string, string>> = {
  MEDIDA_FINA: {
    pendente: 'bg-purple-500 hover:bg-purple-600',
    em_andamento: 'bg-purple-600 hover:bg-purple-500',
    pausado: 'bg-purple-300 hover:bg-purple-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  PROJETO_TECNICO: {
    pendente: 'bg-pink-500 hover:bg-pink-600',
    em_andamento: 'bg-pink-600 hover:bg-pink-500',
    pausado: 'bg-pink-300 hover:bg-pink-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  PRODUCAO: {
    pendente: 'bg-orange-500 hover:bg-orange-600',
    em_andamento: 'bg-orange-600 hover:bg-orange-500',
    pausado: 'bg-orange-300 hover:bg-orange-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  MONTAGEM: {
    pendente: 'bg-cyan-500 hover:bg-cyan-600',
    em_andamento: 'bg-cyan-600 hover:bg-cyan-500',
    pausado: 'bg-cyan-300 hover:bg-cyan-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
  POS_VENDA_GARANTIA: {
    pendente: 'bg-fuchsia-500 hover:bg-fuchsia-600',
    em_andamento: 'bg-fuchsia-600 hover:bg-fuchsia-500',
    pausado: 'bg-fuchsia-300 hover:bg-fuchsia-400',
    concluido: 'bg-slate-700 hover:bg-slate-600',
  },
};

const CARD_BORDER_VENDAS: Record<string, Record<StatusExecucao, string>> = {
  CADASTRO: {
    agendado:
      'border-l-slate-300 bg-slate-50/80 dark:bg-slate-800/30 dark:border-l-slate-600',
    em_andamento:
      'border-l-slate-500 bg-slate-100/80 dark:bg-slate-800/50 dark:border-l-slate-500',
    concluido:
      'border-l-slate-700 bg-slate-100/50 dark:bg-slate-800/40 dark:border-l-slate-700',
  },
  MEDICAO: {
    agendado:
      'border-l-blue-300 bg-blue-50/80 dark:bg-blue-900/20 dark:border-l-blue-700',
    em_andamento:
      'border-l-blue-500 bg-blue-50/80 dark:bg-blue-900/30 dark:border-l-blue-500',
    concluido:
      'border-l-blue-800 bg-blue-50/50 dark:bg-blue-900/25 dark:border-l-blue-800',
  },
  ORCAMENTO: {
    agendado:
      'border-l-amber-300 bg-amber-50/80 dark:bg-amber-900/20 dark:border-l-amber-700',
    em_andamento:
      'border-l-amber-500 bg-amber-50/80 dark:bg-amber-900/30 dark:border-l-amber-500',
    concluido:
      'border-l-amber-700 bg-amber-50/50 dark:bg-amber-900/25 dark:border-l-amber-800',
  },
  AGENDAR_APRESENTACAO: {
    agendado:
      'border-l-indigo-300 bg-indigo-50/80 dark:bg-indigo-900/20 dark:border-l-indigo-700',
    em_andamento:
      'border-l-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/30 dark:border-l-indigo-500',
    concluido:
      'border-l-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/25 dark:border-l-indigo-800',
  },
  FECHAR_VENDA: {
    agendado:
      'border-l-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/20 dark:border-l-emerald-700',
    em_andamento:
      'border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/30 dark:border-l-emerald-500',
    concluido:
      'border-l-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/25 dark:border-l-emerald-800',
  },
  AGENDAR_FECHAMENTO: {
    agendado:
      'border-l-lime-300 bg-lime-50/80 dark:bg-lime-900/20 dark:border-l-lime-700',
    em_andamento:
      'border-l-lime-600 bg-lime-50/80 dark:bg-lime-900/30 dark:border-l-lime-600',
    concluido:
      'border-l-lime-800 bg-lime-50/50 dark:bg-lime-900/25 dark:border-l-lime-800',
  },
};

const CARD_BORDER_PRODUCAO: Record<string, Record<StatusExecucao, string>> = {
  MEDIDA_FINA: {
    agendado:
      'border-l-purple-300 bg-purple-50/80 dark:bg-purple-900/20 dark:border-l-purple-700',
    em_andamento:
      'border-l-purple-500 bg-purple-50/80 dark:bg-purple-900/30 dark:border-l-purple-500',
    concluido:
      'border-l-purple-800 bg-purple-50/50 dark:bg-purple-900/25 dark:border-l-purple-800',
  },
  PROJETO_TECNICO: {
    agendado:
      'border-l-pink-300 bg-pink-50/80 dark:bg-pink-900/20 dark:border-l-pink-700',
    em_andamento:
      'border-l-pink-500 bg-pink-50/80 dark:bg-pink-900/30 dark:border-l-pink-500',
    concluido:
      'border-l-pink-800 bg-pink-50/50 dark:bg-pink-900/25 dark:border-l-pink-800',
  },
  PRODUCAO: {
    agendado:
      'border-l-orange-300 bg-orange-50/80 dark:bg-orange-900/20 dark:border-l-orange-700',
    em_andamento:
      'border-l-orange-500 bg-orange-50/80 dark:bg-orange-900/30 dark:border-l-orange-500',
    concluido:
      'border-l-orange-700 bg-orange-50/50 dark:bg-orange-900/25 dark:border-l-orange-800',
  },
  MONTAGEM: {
    agendado:
      'border-l-cyan-300 bg-cyan-50/80 dark:bg-cyan-900/20 dark:border-l-cyan-700',
    em_andamento:
      'border-l-cyan-500 bg-cyan-50/80 dark:bg-cyan-900/30 dark:border-l-cyan-500',
    concluido:
      'border-l-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/25 dark:border-l-cyan-800',
  },
  POS_VENDA_GARANTIA: {
    agendado:
      'border-l-fuchsia-300 bg-fuchsia-50/80 dark:bg-fuchsia-900/20 dark:border-l-fuchsia-700',
    em_andamento:
      'border-l-fuchsia-500 bg-fuchsia-50/80 dark:bg-fuchsia-900/30 dark:border-l-fuchsia-500',
    concluido:
      'border-l-fuchsia-800 bg-fuchsia-50/50 dark:bg-fuchsia-900/25 dark:border-l-fuchsia-800',
  },
};

const BADGE_VENDAS: Record<string, Record<StatusExecucao, string>> = {
  CADASTRO: {
    agendado:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
    em_andamento:
      'bg-slate-500 text-white border-slate-600 dark:bg-slate-500 dark:border-slate-600',
    concluido:
      'bg-slate-700 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-800',
  },
  MEDICAO: {
    agendado:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
    em_andamento:
      'bg-blue-500 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-600',
    concluido:
      'bg-blue-800 text-white border-blue-900 dark:bg-blue-800 dark:border-blue-900',
  },
  ORCAMENTO: {
    agendado:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    em_andamento:
      'bg-amber-500 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-600',
    concluido:
      'bg-amber-700 text-white border-amber-800 dark:bg-amber-800 dark:border-amber-900',
  },
  AGENDAR_APRESENTACAO: {
    agendado:
      'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
    em_andamento:
      'bg-indigo-500 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-600',
    concluido:
      'bg-indigo-800 text-white border-indigo-900 dark:bg-indigo-800 dark:border-indigo-900',
  },
  FECHAR_VENDA: {
    agendado:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    em_andamento:
      'bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-600',
    concluido:
      'bg-emerald-800 text-white border-emerald-900 dark:bg-emerald-800 dark:border-emerald-900',
  },
  AGENDAR_FECHAMENTO: {
    agendado:
      'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-800',
    em_andamento:
      'bg-lime-600 text-white border-lime-700 dark:bg-lime-600 dark:border-lime-700',
    concluido:
      'bg-lime-800 text-white border-lime-900 dark:bg-lime-800 dark:border-lime-900',
  },
};

/** Título do card (texto) por etapa e status de execução. */
const TITULO_CARD_BY_ETAPA: Record<string, Record<StatusExecucao, string>> = {
  CADASTRO: {
    agendado: 'text-gray-500',
    em_andamento: 'text-gray-700 dark:text-gray-200',
    concluido: 'text-gray-700 dark:text-gray-300',
  },
  MEDICAO: {
    agendado: 'text-blue-600 dark:text-blue-400',
    em_andamento: 'text-blue-600 dark:text-blue-400',
    concluido: 'text-blue-800 dark:text-blue-300',
  },
  ORCAMENTO: {
    agendado: 'text-amber-600 dark:text-amber-400',
    em_andamento: 'text-amber-600 dark:text-amber-400',
    concluido: 'text-amber-800 dark:text-amber-300',
  },
  AGENDAR_APRESENTACAO: {
    agendado: 'text-indigo-600 dark:text-indigo-400',
    em_andamento: 'text-indigo-600 dark:text-indigo-400',
    concluido: 'text-indigo-800 dark:text-indigo-300',
  },
  FECHAR_VENDA: {
    agendado: 'text-emerald-600 dark:text-emerald-400',
    em_andamento: 'text-emerald-600 dark:text-emerald-400',
    concluido: 'text-emerald-800 dark:text-emerald-300',
  },
  AGENDAR_FECHAMENTO: {
    agendado: 'text-lime-600 dark:text-lime-400',
    em_andamento: 'text-lime-600 dark:text-lime-400',
    concluido: 'text-lime-800 dark:text-lime-300',
  },
  MEDIDA_FINA: {
    agendado: 'text-purple-600 dark:text-purple-400',
    em_andamento: 'text-purple-600 dark:text-purple-400',
    concluido: 'text-purple-800 dark:text-purple-300',
  },
  PROJETO_TECNICO: {
    agendado: 'text-pink-600 dark:text-pink-400',
    em_andamento: 'text-pink-600 dark:text-pink-400',
    concluido: 'text-pink-800 dark:text-pink-300',
  },
  PRODUCAO: {
    agendado: 'text-orange-600 dark:text-orange-400',
    em_andamento: 'text-orange-600 dark:text-orange-400',
    concluido: 'text-orange-800 dark:text-orange-300',
  },
  MONTAGEM: {
    agendado: 'text-cyan-600 dark:text-cyan-400',
    em_andamento: 'text-cyan-600 dark:text-cyan-400',
    concluido: 'text-cyan-800 dark:text-cyan-300',
  },
  POS_VENDA_GARANTIA: {
    agendado: 'text-fuchsia-600 dark:text-fuchsia-400',
    em_andamento: 'text-fuchsia-600 dark:text-fuchsia-400',
    concluido: 'text-fuchsia-800 dark:text-fuchsia-300',
  },
};

/** Dot da timeline por etapa e estado (agendado | em_andamento | concluido). */
const DOT_ETAPA_BY_STATE: Record<string, Record<string, string>> = {
  CADASTRO: {
    agendado: 'border-gray-300 bg-gray-100 dark:border-slate-600',
    em_andamento: 'bg-gray-500 border-gray-500',
    concluido: 'bg-gray-700 border-gray-700',
  },
  MEDICAO: {
    agendado: 'border-blue-200 bg-blue-50 dark:border-slate-600',
    em_andamento: 'bg-blue-500 border-blue-500',
    concluido: 'bg-blue-800 border-blue-800',
  },
  ORCAMENTO: {
    agendado: 'border-amber-200 bg-amber-50 dark:border-slate-600',
    em_andamento: 'bg-amber-500 border-amber-500',
    concluido: 'bg-amber-700 border-amber-700',
  },
  AGENDAR_APRESENTACAO: {
    agendado: 'border-indigo-200 bg-indigo-50 dark:border-slate-600',
    em_andamento: 'bg-indigo-500 border-indigo-500',
    concluido: 'bg-indigo-800 border-indigo-800',
  },
  FECHAR_VENDA: {
    agendado: 'border-emerald-200 bg-emerald-50 dark:border-slate-600',
    em_andamento: 'bg-emerald-500 border-emerald-500',
    concluido: 'bg-emerald-800 border-emerald-800',
  },
  AGENDAR_FECHAMENTO: {
    agendado: 'border-lime-200 bg-lime-50 dark:border-slate-600',
    em_andamento: 'bg-lime-600 border-lime-600',
    concluido: 'bg-lime-800 border-lime-800',
  },
  MEDIDA_FINA: {
    agendado: 'border-purple-200 bg-purple-50 dark:border-slate-600',
    em_andamento: 'bg-purple-500 border-purple-500',
    concluido: 'bg-purple-800 border-purple-800',
  },
  PROJETO_TECNICO: {
    agendado: 'border-pink-200 bg-pink-50 dark:border-slate-600',
    em_andamento: 'bg-pink-500 border-pink-500',
    concluido: 'bg-pink-800 border-pink-800',
  },
  PRODUCAO: {
    agendado: 'border-orange-200 bg-orange-50 dark:border-slate-600',
    em_andamento: 'bg-orange-500 border-orange-500',
    concluido: 'bg-orange-700 border-orange-700',
  },
  MONTAGEM: {
    agendado: 'border-cyan-200 bg-cyan-50 dark:border-slate-600',
    em_andamento: 'bg-cyan-500 border-cyan-500',
    concluido: 'bg-cyan-800 border-cyan-800',
  },
  POS_VENDA_GARANTIA: {
    agendado: 'border-fuchsia-200 bg-fuchsia-50 dark:border-slate-600',
    em_andamento: 'bg-fuchsia-500 border-fuchsia-500',
    concluido: 'bg-fuchsia-800 border-fuchsia-800',
  },
};

const BADGE_PRODUCAO: Record<string, Record<StatusExecucao, string>> = {
  MEDIDA_FINA: {
    agendado:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
    em_andamento:
      'bg-purple-500 text-white border-purple-600 dark:bg-purple-500 dark:border-purple-600',
    concluido:
      'bg-purple-800 text-white border-purple-900 dark:bg-purple-800 dark:border-purple-900',
  },
  PROJETO_TECNICO: {
    agendado:
      'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
    em_andamento:
      'bg-pink-500 text-white border-pink-600 dark:bg-pink-500 dark:border-pink-600',
    concluido:
      'bg-pink-800 text-white border-pink-900 dark:bg-pink-800 dark:border-pink-900',
  },
  PRODUCAO: {
    agendado:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
    em_andamento:
      'bg-orange-500 text-white border-orange-600 dark:bg-orange-500 dark:border-orange-600',
    concluido:
      'bg-orange-700 text-white border-orange-800 dark:bg-orange-800 dark:border-orange-900',
  },
  MONTAGEM: {
    agendado:
      'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    em_andamento:
      'bg-cyan-500 text-white border-cyan-600 dark:bg-cyan-500 dark:border-cyan-600',
    concluido:
      'bg-cyan-800 text-white border-cyan-900 dark:bg-cyan-800 dark:border-cyan-900',
  },
  POS_VENDA_GARANTIA: {
    agendado:
      'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 dark:border-fuchsia-800',
    em_andamento:
      'bg-fuchsia-500 text-white border-fuchsia-600 dark:bg-fuchsia-500 dark:border-fuchsia-600',
    concluido:
      'bg-fuchsia-800 text-white border-fuchsia-900 dark:bg-fuchsia-800 dark:border-fuchsia-900',
  },
};

/** Objeto completo para o frontend (GET /utils/status-colors). */
export function getStatusColorsConfig() {
  return {
    statusShades: { ...STATUS_SHADES },
    etapaKeys: [...ETAPA_KEYS],
    categoriasProjetoTecnico: [...CATEGORIAS_PROJETO_TECNICO],
    categoriaToEtapaKey: { ...CATEGORIA_TO_ETAPA_KEY },
    etapasOficial: [...ETAPAS_OFICIAL],
    vendasEtapaKeys: [...VENDAS_ETAPA_KEYS],
    producaoEtapaKeys: [...PRODUCAO_ETAPA_KEYS],
    borderLeft: { ...BORDA_ESQUERDA },
    badgeTime: { ...BADGE_TEMPO },
    dot: { ...DOT },
    hoverBg: { ...HOVER_BG },
    borderBottom: { ...BORDER_BOTTOM },
    lineBg: { ...LINE_BG },
    dotBorder: { ...DOT_BORDER },
    borderL4ByStatus: JSON.parse(JSON.stringify(BORDER_L4_BY_STATUS)),
    badgeTempoByStatus: JSON.parse(JSON.stringify(BADGE_TEMPO_BY_STATUS)),
    dotByStatus: JSON.parse(JSON.stringify(DOT_BY_STATUS)),
    calendarEventVendas: JSON.parse(JSON.stringify(CALENDAR_EVENT_VENDAS)),
    calendarEventProducao: JSON.parse(JSON.stringify(CALENDAR_EVENT_PRODUCAO)),
    cardBorderVendas: JSON.parse(JSON.stringify(CARD_BORDER_VENDAS)),
    cardBorderProducao: JSON.parse(JSON.stringify(CARD_BORDER_PRODUCAO)),
    badgeVendas: JSON.parse(JSON.stringify(BADGE_VENDAS)),
    badgeProducao: JSON.parse(JSON.stringify(BADGE_PRODUCAO)),
    tituloCardByEtapa: JSON.parse(JSON.stringify(TITULO_CARD_BY_ETAPA)),
    dotEtapaByState: JSON.parse(JSON.stringify(DOT_ETAPA_BY_STATE)),
  };
}
