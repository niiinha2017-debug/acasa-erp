import { PIPELINE_CLIENTE as PIPELINE_CLIENTE_FASES_RAW } from '../../../shared/constantes/pipeline-cliente';

type PipelineClienteFaseItem = {
  fase: string;
  label: string;
  ordem: number;
  statusInternos: string[];
  temAgendamento?: boolean;
  dataCampo?: string;
};

type PipelineClienteItem = {
  key: string;
  label: string;
  fase: string;
  ordem: number;
  temTela: boolean;
  disparaComData?: string;
};

const STATUS_LABELS: Record<string, string> = {
  CLIENTE_CADASTRADO: 'Cliente cadastrado',
  AGENDAR_MEDIDA: 'Agendar medida',
  MEDIDA_AGENDADA: 'Medida agendada',
  MEDIDA_REALIZADA: 'Medida realizada',
  CRIAR_ORCAMENTO: 'Criar orçamento',
  ORCAMENTO_EM_ANDAMENTO: 'Orçamento em andamento',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  ORCAMENTO_EM_NEGOCIACAO: 'Orçamento em negociação',
  ORCAMENTO_APROVADO: 'Orçamento aprovado',
  ORCAMENTO_REPROVADO: 'Orçamento reprovado',
  AGENDAR_APRESENTACAO: 'Agendar apresentação',
  APRESENTACAO_AGENDADA: 'Apresentação agendada',
  ORCAMENTO_APRESENTADO: 'Orçamento apresentado',
  VENDA_FECHADA: 'Venda fechada',
  CONTRATO_GERADO: 'Contrato gerado',
  CONTRATO_ASSINADO: 'Contrato assinado',
  AGENDAR_MEDIDA_FINA: 'Agendar medida fina',
  MEDIDA_FINA_AGENDADA: 'Medida fina agendada',
  MEDIDA_FINA_REALIZADA: 'Medida fina realizada',
  PROJETO_TECNICO_EM_ANDAMENTO: 'Projeto técnico em andamento',
  PROJETO_TECNICO_APROVADO: 'Projeto técnico aprovado',
  PRODUCAO_AGENDADA: 'Produção agendada',
  EM_PRODUCAO: 'Em produção',
  PRODUCAO_FINALIZADA: 'Produção finalizada',
  AGENDAR_MONTAGEM: 'Agendar montagem',
  MONTAGEM_AGENDADA: 'Montagem agendada',
  EM_MONTAGEM: 'Em montagem',
  MONTAGEM_FINALIZADA: 'Montagem finalizada',
  GARANTIA: 'Garantia',
  ASSISTENCIA: 'Assistência',
  MANUTENCAO: 'Manutenção',
  ENCERRADO: 'Encerrado',
};

const PIPELINE_CLIENTE_FASES =
  PIPELINE_CLIENTE_FASES_RAW as PipelineClienteFaseItem[];

export const PIPELINE_CLIENTE: PipelineClienteItem[] =
  PIPELINE_CLIENTE_FASES.flatMap((faseItem) =>
    (Array.isArray(faseItem.statusInternos) ? faseItem.statusInternos : []).map(
      (status, idx) => ({
        key: String(status || '').toUpperCase(),
        label:
          STATUS_LABELS[String(status || '').toUpperCase()] ||
          String(status || ''),
        fase: faseItem.fase,
        ordem: Number(faseItem.ordem || 0) * 100 + idx,
        temTela: /^(AGENDAR_|CRIAR_)/.test(String(status || '').toUpperCase()),
        disparaComData:
          idx === 0 && faseItem.temAgendamento && faseItem.dataCampo
            ? faseItem.dataCampo
            : undefined,
      }),
    ),
  ).filter((item) => item.key);

export const PIPELINE_CLIENTE_KEYS = PIPELINE_CLIENTE.map((item) => item.key);

const PIPELINE_CLIENTE_ORDEM = PIPELINE_CLIENTE.reduce<Record<string, number>>(
  (acc, item) => {
    acc[item.key] = item.ordem;
    return acc;
  },
  {},
);

export const STATUS_POS_VENDA = [
  'GARANTIA',
  'MANUTENCAO',
  'ASSISTENCIA',
  'ENCERRADO',
];

export function normalizarStatusCliente(status?: string | null): string {
  return String(status || '')
    .trim()
    .toUpperCase();
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

  if (!atual) {
    return { ok: true };
  }

  if (!statusClienteEhValido(atual)) {
    return {
      ok: false,
      motivo: `Status atual "${atual}" é inválido no pipeline.`,
    };
  }

  if (atual === proximo) {
    return { ok: true };
  }

  const atualEhPosVenda = STATUS_POS_VENDA.includes(atual);
  const proximoEhPosVenda = STATUS_POS_VENDA.includes(proximo);
  if (atualEhPosVenda && proximoEhPosVenda) {
    return { ok: true };
  }

  const ordemAtual = PIPELINE_CLIENTE_ORDEM[atual];
  const ordemProximo = PIPELINE_CLIENTE_ORDEM[proximo];

  if (ordemProximo < ordemAtual) {
    return {
      ok: false,
      motivo: `Transição inválida de "${atual}" para "${proximo}": retrocesso no fluxo não é permitido.`,
    };
  }

  return { ok: true };
}
