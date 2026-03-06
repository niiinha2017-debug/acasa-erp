/**
 * Pipeline Cliente – 5 fases até a entrega final.
 * 1 CADASTRO | 2 MEDIÇÃO | 3 ORÇAMENTO | 4 CONTRATO (Vigência 1 ano) | 5 PRODUÇÃO/MONTAGEM (45 dias).
 * A fase 5 só é considerada atingida quando a Medida Fina for concluída na Timeline (lógica no frontend).
 */

const FASES: Array<{
  ordem: number;
  fase: string;
  label: string;
  cor: string;
  temAgendamento?: boolean;
  verificacao: (cliente: any) => boolean;
}> = [
  {
    ordem: 1,
    fase: 'CADASTRO',
    label: 'Cadastro',
    cor: '#94a3b8', // Slate
    verificacao: (cliente) => !!cliente?.id,
  },
  {
    ordem: 2,
    fase: 'MEDICAO_VENDA',
    label: 'Medição',
    cor: '#3b82f6', // Blue
    temAgendamento: true,
    verificacao: (cliente) => {
      const loja = (cliente?.agendamentos_loja ?? []).length > 0;
      const fab = (cliente?.agendamentos_fabrica ?? []).length > 0;
      return loja || fab;
    },
  },
  {
    ordem: 3,
    fase: 'ORCAMENTO',
    label: 'Orçamento',
    cor: '#a855f7', // Purple
    verificacao: (cliente) => (cliente?.orcamentos?.length ?? 0) > 0,
  },
  {
    ordem: 4,
    fase: 'CONTRATO',
    label: 'Contrato',
    cor: '#10b981', // Emerald
    verificacao: (cliente) =>
      (cliente?.contratos ?? []).some((c: any) => c?.status === 'VIGENTE'),
  },
  {
    ordem: 5,
    fase: 'PRODUCAO_MONTAGEM',
    label: 'Produção/Montagem',
    cor: '#0d9488', // Teal
    verificacao: () => false, // Ativa no frontend apenas quando Medida Fina for concluída na Timeline
  },
];

/** Pipeline com .key por fase (para dropdown, progresso e validação). */
export const PIPELINE_CLIENTE = FASES.map((f) => ({
  ...f,
  key: f.fase,
  ordem: f.ordem,
}));

/** Alias para compatibilidade (mesma lista). */
export const PIPELINE_CLIENTE_FASES = PIPELINE_CLIENTE;

export const PIPELINE_CLIENTE_KEYS = PIPELINE_CLIENTE.map((p) => p.key);

/** Mapeia status antigos do banco para as 5 fases (compatibilidade). Fase 5 = após Medida Fina concluída. */
const STATUS_ANTIGO_PARA_FASE: Record<string, string> = {
  ATIVO: 'CADASTRO', // cliente já cadastrado entra no fluxo na primeira fase
  CLIENTE_CADASTRADO: 'CADASTRO',
  AGENDAR_MEDIDA_VENDA: 'MEDICAO_VENDA',
  MEDIDA_AGENDADA: 'MEDICAO_VENDA',
  MEDIDA_EM_ANDAMENTO: 'MEDICAO_VENDA',
  MEDIDA_REALIZADA: 'MEDICAO_VENDA',
  MEDIDA_VENDA_REALIZADA: 'MEDICAO_VENDA',
  CRIAR_ORCAMENTO: 'ORCAMENTO',
  ORCAMENTO_EM_ANDAMENTO: 'ORCAMENTO',
  ORCAMENTO_ENVIADO: 'ORCAMENTO',
  ORCAMENTO_EM_NEGOCIACAO: 'ORCAMENTO',
  ORCAMENTO_APROVADO: 'ORCAMENTO',
  ORCAMENTO_REPROVADO: 'ORCAMENTO',
  AGENDAR_APRESENTACAO: 'ORCAMENTO',
  APRESENTACAO_AGENDADA: 'ORCAMENTO',
  ORCAMENTO_APRESENTADO: 'ORCAMENTO',
  VENDA_FECHADA: 'CONTRATO',
  CONTRATO_GERADO: 'CONTRATO',
  CONTRATO_ASSINADO: 'CONTRATO',
  AGENDAR_MEDIDA_FINA: 'CONTRATO',
  MEDIDA_FINA_AGENDADA: 'CONTRATO',
  MEDIDA_FINA_REALIZADA: 'PRODUCAO_MONTAGEM',
  AGUARDANDO_PROJETO_TECNICO: 'PRODUCAO_MONTAGEM',
  PROJETO_TECNICO_EM_ANDAMENTO: 'PRODUCAO_MONTAGEM',
  PROJETO_TECNICO_CONCLUIDO: 'PRODUCAO_MONTAGEM',
  PROJETO_TECNICO_APROVADO: 'PRODUCAO_MONTAGEM',
  PRODUCAO_AGENDADA: 'PRODUCAO_MONTAGEM',
  EM_PRODUCAO: 'PRODUCAO_MONTAGEM',
  PRODUCAO_FINALIZADA: 'PRODUCAO_MONTAGEM',
  AGENDAR_MONTAGEM: 'PRODUCAO_MONTAGEM',
  MONTAGEM_AGENDADA: 'PRODUCAO_MONTAGEM',
  EM_MONTAGEM: 'PRODUCAO_MONTAGEM',
  MONTAGEM_FINALIZADA: 'PRODUCAO_MONTAGEM',
  GARANTIA: 'PRODUCAO_MONTAGEM',
  ASSISTENCIA: 'PRODUCAO_MONTAGEM',
  MANUTENCAO: 'PRODUCAO_MONTAGEM',
  ENCERRADO: 'PRODUCAO_MONTAGEM',
};

/** Pos-venda não usado na versão simples; vazio para não quebrar. */
export const STATUS_POS_VENDA: string[] = [];

/**
 * Status de venda que indicam "obra vigente" (em medição, em produção ou em montagem).
 * Usado no Painel de Obras Vigentes. Início da vigência: assim que atinge AGENDAR_MEDIDA_FINA.
 * Exclui: MONTAGEM_FINALIZADA/ENCERRADO (obra terminou).
 */
export const OBRA_VIGENTE_STATUSES: string[] = [
  'AGENDAR_MEDIDA_FINA',
  'MEDIDA_FINA_AGENDADA',
  'MEDIDA_FINA_REALIZADA',
  'AGUARDANDO_PROJETO_TECNICO',
  'PROJETO_TECNICO_EM_ANDAMENTO',
  'PROJETO_TECNICO_CONCLUIDO',
  'PROJETO_TECNICO_APROVADO',
  'PRODUCAO_AGENDADA',
  'EM_PRODUCAO',
  'PRODUCAO_FINALIZADA',
  'AGENDAR_MONTAGEM',
  'MONTAGEM_AGENDADA',
  'EM_MONTAGEM',
];

const ORDEM_POR_KEY = PIPELINE_CLIENTE.reduce<Record<string, number>>(
  (acc, item) => {
    acc[item.key] = item.ordem;
    return acc;
  },
  {},
);

export function normalizarStatusCliente(status?: string | null): string {
  const s = String(status ?? '').trim().toUpperCase();
  return STATUS_ANTIGO_PARA_FASE[s] ?? s;
}

export function statusClienteEhValido(status?: string | null): boolean {
  const key = normalizarStatusCliente(status);
  return PIPELINE_CLIENTE_KEYS.includes(key);
}

export function validarTransicaoStatusCliente(params: {
  atual?: string | null;
  proximo?: string | null;
}): { ok: boolean; motivo?: string } {
  const atual = normalizarStatusCliente(params.atual);
  const proximo = normalizarStatusCliente(params.proximo);

  if (!proximo) {
    return { ok: false, motivo: 'Status de destino não informado.' };
  }
  if (!statusClienteEhValido(proximo)) {
    return { ok: false, motivo: `Status "${proximo}" é inválido no pipeline.` };
  }
  if (!atual) return { ok: true };
  if (!statusClienteEhValido(atual)) {
    return { ok: false, motivo: `Status atual "${atual}" é inválido no pipeline.` };
  }
  if (atual === proximo) return { ok: true };

  const ordemAtual = ORDEM_POR_KEY[atual];
  const ordemProximo = ORDEM_POR_KEY[proximo];
  if (ordemProximo < ordemAtual) {
    return {
      ok: false,
      motivo: `Transição inválida de "${atual}" para "${proximo}": retrocesso não permitido.`,
    };
  }
  return { ok: true };
}
