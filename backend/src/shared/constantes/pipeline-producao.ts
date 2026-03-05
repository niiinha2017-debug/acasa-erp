import { PIPELINE_PRODUCAO as PIPELINE_PRODUCAO_RAW } from '../../../shared/constantes/pipeline-producao';

type PipelineProducaoItem = {
  key: string;
  label: string;
  fase: string;
  ordem: number;
  temTela: boolean;
  badgeClass: string;
  disparaComData?: string;
  /** Cor da etapa na agenda: frontend usa com tom claro → escuro por status. */
  colorFamily?: string;
};

const raw = PIPELINE_PRODUCAO_RAW as Array<{
  key: string;
  label?: string;
  fase: string;
  ordem: number;
  temTela?: boolean;
  badgeClass?: string;
  disparaComData?: string;
  colorFamily?: string;
}>;

export const PIPELINE_PRODUCAO: PipelineProducaoItem[] = raw.map((p) => ({
  key: p.key,
  label: p.label ?? p.key,
  fase: p.fase,
  ordem: p.ordem,
  temTela: p.temTela ?? false,
  badgeClass: p.badgeClass ?? 'bg-slate-100 text-slate-700',
  disparaComData: p.disparaComData,
  colorFamily: p.colorFamily ?? 'slate',
}));

export const PIPELINE_PRODUCAO_KEYS = PIPELINE_PRODUCAO.map((p) => p.key);

// =============================================================================
// Regras de visibilidade da Agenda de Produção (fonte única – backend e frontend)
// =============================================================================
/** Categorias que, com status PENDENTE, aparecem só no painel do topo; no calendário aparecem quando agendados ou concluídos. */
export const AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS = ['AGENDAR_MEDIDA_FINA'] as const;
/** Status que faz "medida fina agendada" aparecer no calendário. */
export const AGENDA_FABRICA_STATUS_AGENDADO = 'EM_ANDAMENTO';
/** Eventos com este status sempre aparecem no calendário (histórico). */
export const AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL = 'CONCLUIDO';

const PIPELINE_PRODUCAO_ORDEM = PIPELINE_PRODUCAO.reduce<Record<string, number>>(
  (acc, item) => {
    acc[item.key] = item.ordem;
    return acc;
  },
  {},
);

export function normalizarStatusProducao(status?: string | null): string {
  return String(status || '').trim().toUpperCase();
}

export function statusProducaoEhValido(status?: string | null): boolean {
  const key = normalizarStatusProducao(status);
  return PIPELINE_PRODUCAO_KEYS.includes(key);
}

export function validarTransicaoStatusProducao(params: {
  atual?: string | null;
  proximo?: string | null;
}): { ok: boolean; motivo?: string } {
  const atual = normalizarStatusProducao(params.atual);
  const proximo = normalizarStatusProducao(params.proximo);

  if (!proximo) {
    return { ok: false, motivo: 'Status de destino não informado.' };
  }

  if (!statusProducaoEhValido(proximo)) {
    return { ok: false, motivo: `Status "${proximo}" é inválido no pipeline de produção.` };
  }

  if (!atual) {
    return { ok: true };
  }

  if (!statusProducaoEhValido(atual)) {
    return {
      ok: false,
      motivo: `Status atual "${atual}" é inválido no pipeline de produção.`,
    };
  }

  if (atual === proximo) {
    return { ok: true };
  }

  const ordemAtual = PIPELINE_PRODUCAO_ORDEM[atual];
  const ordemProximo = PIPELINE_PRODUCAO_ORDEM[proximo];

  if (ordemProximo < ordemAtual) {
    return {
      ok: false,
      motivo: `Transição inválida de "${atual}" para "${proximo}": retrocesso no fluxo não é permitido.`,
    };
  }

  return { ok: true };
}
