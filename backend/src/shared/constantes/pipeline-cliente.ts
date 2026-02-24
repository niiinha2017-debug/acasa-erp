type PipelineClienteItem = {
  key: string;
  fase: string;
  ordem: number;
};

export const PIPELINE_CLIENTE: PipelineClienteItem[] = [
  { key: 'CLIENTE_CADASTRADO', fase: 'CADASTRO', ordem: 1 },
  { key: 'AGENDAR_MEDIDA', fase: 'MEDIDA', ordem: 2 },
  { key: 'MEDIDA_AGENDADA', fase: 'MEDIDA', ordem: 3 },
  { key: 'MEDIDA_REALIZADA', fase: 'MEDIDA', ordem: 4 },
  { key: 'CRIAR_ORCAMENTO', fase: 'ORCAMENTO', ordem: 5 },
  { key: 'ORCAMENTO_EM_ANDAMENTO', fase: 'ORCAMENTO', ordem: 6 },
  { key: 'ORCAMENTO_ENVIADO', fase: 'ORCAMENTO', ordem: 7 },
  { key: 'ORCAMENTO_EM_NEGOCIACAO', fase: 'ORCAMENTO', ordem: 8 },
  { key: 'ORCAMENTO_APROVADO', fase: 'ORCAMENTO', ordem: 9 },
  { key: 'ORCAMENTO_REPROVADO', fase: 'ORCAMENTO', ordem: 10 },
  { key: 'VENDA_FECHADA', fase: 'VENDA', ordem: 11 },
  { key: 'CONTRATO_GERADO', fase: 'CONTRATO', ordem: 12 },
  { key: 'AGENDAR_MEDIDA_FINA', fase: 'MEDIDA_FINA', ordem: 13 },
  { key: 'MEDIDA_FINA_AGENDADA', fase: 'MEDIDA_FINA', ordem: 14 },
  { key: 'MEDIDA_FINA_REALIZADA', fase: 'MEDIDA_FINA', ordem: 15 },
  { key: 'PROJETO_TECNICO_EM_ANDAMENTO', fase: 'PROJETO', ordem: 16 },
  { key: 'PROJETO_TECNICO_APROVADO', fase: 'PROJETO', ordem: 17 },
  { key: 'PLANO_DE_CORTE', fase: 'PRODUCAO', ordem: 18 },
  { key: 'PRODUCAO_AGENDADA', fase: 'PRODUCAO', ordem: 19 },
  { key: 'EM_PRODUCAO', fase: 'PRODUCAO', ordem: 20 },
  { key: 'PRODUCAO_FINALIZADA', fase: 'PRODUCAO', ordem: 21 },
  { key: 'AGENDAR_MONTAGEM', fase: 'MONTAGEM', ordem: 22 },
  { key: 'MONTAGEM_AGENDADA', fase: 'MONTAGEM', ordem: 23 },
  { key: 'EM_MONTAGEM', fase: 'MONTAGEM', ordem: 24 },
  { key: 'MONTAGEM_FINALIZADA', fase: 'MONTAGEM', ordem: 25 },
  { key: 'GARANTIA', fase: 'POS_VENDA', ordem: 26 },
  { key: 'ASSISTENCIA', fase: 'POS_VENDA', ordem: 27 },
  { key: 'MANUTENCAO', fase: 'POS_VENDA', ordem: 28 },
  { key: 'ENCERRADO', fase: 'FINAL', ordem: 29 },
];

export const PIPELINE_CLIENTE_KEYS = PIPELINE_CLIENTE.map((item) => item.key);

const PIPELINE_CLIENTE_ORDEM = PIPELINE_CLIENTE.reduce<Record<string, number>>(
  (acc, item) => {
    acc[item.key] = item.ordem;
    return acc;
  },
  {},
);

export const STATUS_POS_VENDA = ['GARANTIA', 'MANUTENCAO', 'ASSISTENCIA'];

const STATUS_PRODUCAO = [
  'PRODUCAO_AGENDADA',
  'EM_PRODUCAO',
  'PRODUCAO_FINALIZADA',
];

const STATUS_MINIMO_PARA_PRODUCAO = 'PROJETO_TECNICO_APROVADO';

export function normalizarStatusCliente(status?: string | null): string {
  return String(status || '').trim().toUpperCase();
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
    return { ok: false, motivo: `Status atual "${atual}" é inválido no pipeline.` };
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

  if (STATUS_PRODUCAO.includes(proximo)) {
    const ordemMinima = PIPELINE_CLIENTE_ORDEM[STATUS_MINIMO_PARA_PRODUCAO];
    if (ordemAtual < ordemMinima) {
      return {
        ok: false,
        motivo:
          'Não é possível avançar para produção antes da aprovação do projeto técnico.',
      };
    }
  }

  return { ok: true };
}
