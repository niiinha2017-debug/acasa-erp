import { PIPELINE_PLANO_CORTE as PIPELINE_PLANO_CORTE_FASES_RAW } from '../../../shared/constantes/pipeline-plano-corte';

type PipelinePlanoCorteFaseItem = {
  fase: string;
  label: string;
  ordem: number;
  statusInternos: string[];
  cor?: string;
  badgeClass?: string;
  dotClass?: string;
  temTela?: boolean;
};

type PipelinePlanoCorteItem = {
  key: string;
  label: string;
  fase: string;
  ordem: number;
  temTela: boolean;
  badgeClass: string;
  dotClass: string;
};

const STATUS_LABELS: Record<string, string> = {
  EM_ABERTO: 'Em aberto',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  CONFERENCIA_TECNICA: 'Conferência técnica',
  LIBERADO_PARA_CORTE: 'Liberado para corte',
  NA_FILA_DE_CORTE: 'Na fila de corte',
  EM_EXECUCAO: 'Em execução',
  PRODUCAO_FINALIZADA: 'Produção Finalizada',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  COMPENSADO: 'Compensado',
  // Mesmos da agenda de produção (pipeline-producao)
  PRODUCAO_RECEBIDA: 'Produção Recebida',
  CORTE: 'Corte / Usinagem',
};

const PIPELINE_PLANO_CORTE_FASES =
  PIPELINE_PLANO_CORTE_FASES_RAW as PipelinePlanoCorteFaseItem[];

export const PIPELINE_PLANO_CORTE: PipelinePlanoCorteItem[] =
  PIPELINE_PLANO_CORTE_FASES.flatMap((faseItem) =>
    (Array.isArray(faseItem.statusInternos) ? faseItem.statusInternos : []).map(
      (status, idx) => {
        const key = String(status || '').toUpperCase();
        return {
          key,
          label:
            STATUS_LABELS[key] ||
            faseItem.label ||
            String(status || ''),
          fase: faseItem.fase,
          ordem: Number(faseItem.ordem || 0) * 100 + idx,
          temTela: faseItem.temTela ?? false,
          badgeClass: faseItem.badgeClass ?? 'bg-slate-50 text-slate-700 border border-slate-200',
          dotClass: faseItem.dotClass ?? 'bg-slate-500',
        };
      },
    ),
  ).filter((item) => item.key);

export const PIPELINE_PLANO_CORTE_KEYS = PIPELINE_PLANO_CORTE.map((p) => p.key);

const PIPELINE_PLANO_CORTE_ORDEM = PIPELINE_PLANO_CORTE.reduce<Record<string, number>>(
  (acc, item) => {
    acc[item.key] = item.ordem;
    return acc;
  },
  {},
);

export function normalizarStatusPlanoCorte(status?: string | null): string {
  return String(status || '').trim().toUpperCase();
}

export function statusPlanoCorteEhValido(status?: string | null): boolean {
  const key = normalizarStatusPlanoCorte(status);
  return PIPELINE_PLANO_CORTE_KEYS.includes(key);
}

export function validarTransicaoStatusPlanoCorte(params: {
  atual?: string | null;
  proximo?: string | null;
}): { ok: boolean; motivo?: string } {
  const atual = normalizarStatusPlanoCorte(params.atual);
  const proximo = normalizarStatusPlanoCorte(params.proximo);

  if (!proximo) {
    return { ok: false, motivo: 'Status de destino não informado.' };
  }

  if (!statusPlanoCorteEhValido(proximo)) {
    return { ok: false, motivo: `Status "${proximo}" é inválido no pipeline do serviço de corte.` };
  }

  if (!atual) {
    return { ok: true };
  }

  if (!statusPlanoCorteEhValido(atual)) {
    return {
      ok: false,
      motivo: `Status atual "${atual}" é inválido no pipeline do serviço de corte.`,
    };
  }

  if (atual === proximo) {
    return { ok: true };
  }

  const ordemAtual = PIPELINE_PLANO_CORTE_ORDEM[atual];
  const ordemProximo = PIPELINE_PLANO_CORTE_ORDEM[proximo];

  if (ordemProximo < ordemAtual) {
    return {
      ok: false,
      motivo: `Transição inválida de "${atual}" para "${proximo}": retrocesso no fluxo não é permitido.`,
    };
  }

  return { ok: true };
}
