export const FLUXO_TIPOS = ['MARCENARIA', 'SERVICO_CORTE'] as const;
export const MACRO_ETAPAS = ['COMERCIAL', 'ENGENHARIA', 'FABRICA', 'LOGISTICA', 'POS_VENDA'] as const;
export const EXECUCOES_ETAPA = ['PENDENTE', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO'] as const;
export const SUBETAPAS = [
  'CADASTRO', 'MEDIDA', 'ORCAMENTO', 'APRESENTACAO', 'FECHAMENTO',
  'MEDIDA_FINA', 'PROJETO_TECNICO', 'PRODUCAO', 'SERVICO_CORTE_FITA_BORDA',
  'ENTREGA', 'MONTAGEM', 'GARANTIA', 'ASSISTENCIA', 'MANUTENCAO',
] as const;

export type FluxoTipo = (typeof FLUXO_TIPOS)[number];
export type MacroEtapa = (typeof MACRO_ETAPAS)[number];
export type ExecucaoEtapa = (typeof EXECUCOES_ETAPA)[number];
export type Subetapa = (typeof SUBETAPAS)[number];

export type StatusMatrixSnapshot = {
  fluxo_tipo: FluxoTipo;
  macroetapa: MacroEtapa;
  subetapa: Subetapa;
  execucao: ExecucaoEtapa;
};

export type ClassificacaoFluxoVenda = {
  emProducao: boolean;
  finalizada: boolean;
  obraVigente: boolean;
};

type SubetapaCatalogItem = {
  key: Subetapa;
  label: string;
  macroetapa: MacroEtapa;
  fluxos: FluxoTipo[];
  ordem: number;
  terminal?: boolean;
  proximaSubetapa?: Subetapa | null;
};

export const SUBETAPAS_CATALOGO: SubetapaCatalogItem[] = [
  { key: 'CADASTRO', label: 'Cadastro', macroetapa: 'COMERCIAL', fluxos: ['MARCENARIA'], ordem: 5, proximaSubetapa: 'MEDIDA' },
  { key: 'MEDIDA', label: 'Medição inicial', macroetapa: 'COMERCIAL', fluxos: ['MARCENARIA'], ordem: 10, proximaSubetapa: 'ORCAMENTO' },
  { key: 'ORCAMENTO', label: 'Orçamento', macroetapa: 'COMERCIAL', fluxos: ['MARCENARIA'], ordem: 20, proximaSubetapa: 'APRESENTACAO' },
  { key: 'APRESENTACAO', label: 'Apresentação', macroetapa: 'COMERCIAL', fluxos: ['MARCENARIA'], ordem: 30, proximaSubetapa: 'FECHAMENTO' },
  { key: 'FECHAMENTO', label: 'Fechamento', macroetapa: 'COMERCIAL', fluxos: ['MARCENARIA'], ordem: 40, proximaSubetapa: 'MEDIDA_FINA' },
  { key: 'MEDIDA_FINA', label: 'Medida fina', macroetapa: 'ENGENHARIA', fluxos: ['MARCENARIA'], ordem: 50, proximaSubetapa: 'PROJETO_TECNICO' },
  { key: 'PROJETO_TECNICO', label: 'Projeto técnico', macroetapa: 'ENGENHARIA', fluxos: ['MARCENARIA'], ordem: 60, proximaSubetapa: 'PRODUCAO' },
  { key: 'PRODUCAO', label: 'Produção', macroetapa: 'FABRICA', fluxos: ['MARCENARIA'], ordem: 70, proximaSubetapa: 'ENTREGA' },
  { key: 'SERVICO_CORTE_FITA_BORDA', label: 'Serviço de Corte e Fita de Borda', macroetapa: 'FABRICA', fluxos: ['SERVICO_CORTE'], ordem: 75, terminal: true, proximaSubetapa: null },
  { key: 'ENTREGA', label: 'Material carregado', macroetapa: 'LOGISTICA', fluxos: ['MARCENARIA'], ordem: 80, proximaSubetapa: 'MONTAGEM' },
  { key: 'MONTAGEM', label: 'Montagem', macroetapa: 'LOGISTICA', fluxos: ['MARCENARIA'], ordem: 90, proximaSubetapa: 'GARANTIA' },
  { key: 'GARANTIA', label: 'Garantia', macroetapa: 'POS_VENDA', fluxos: ['MARCENARIA'], ordem: 100, terminal: true, proximaSubetapa: null },
  { key: 'ASSISTENCIA', label: 'Assistência', macroetapa: 'POS_VENDA', fluxos: ['MARCENARIA'], ordem: 101, terminal: true, proximaSubetapa: null },
  { key: 'MANUTENCAO', label: 'Manutenção', macroetapa: 'POS_VENDA', fluxos: ['MARCENARIA'], ordem: 102, terminal: true, proximaSubetapa: null },
];

export const SUBETAPA_CATALOGO_POR_KEY = SUBETAPAS_CATALOGO.reduce<Record<Subetapa, SubetapaCatalogItem>>(
  (acc, item) => { acc[item.key] = item; return acc; },
  {} as Record<Subetapa, SubetapaCatalogItem>,
);

const SUBETAPAS_PRODUCAO_ATIVA = new Set<Subetapa>(['PRODUCAO', 'SERVICO_CORTE_FITA_BORDA']);
const SUBETAPAS_FINALIZACAO_VENDA = new Set<Subetapa>(['MONTAGEM', 'GARANTIA', 'ASSISTENCIA', 'MANUTENCAO', 'SERVICO_CORTE_FITA_BORDA']);
const SUBETAPAS_OBRA_VIGENTE = new Set<Subetapa>(['MEDIDA_FINA', 'PROJETO_TECNICO', 'PRODUCAO', 'SERVICO_CORTE_FITA_BORDA', 'ENTREGA', 'MONTAGEM', 'GARANTIA', 'ASSISTENCIA', 'MANUTENCAO']);

export function normalizarExecucaoEtapa(valor?: string | null): ExecucaoEtapa | null {
  const key = String(valor || '').trim().toUpperCase();
  if ((EXECUCOES_ETAPA as readonly string[]).includes(key)) return key as ExecucaoEtapa;
  return null;
}

export function normalizarSubetapa(valor?: string | null): Subetapa | null {
  const key = String(valor || '').trim().toUpperCase();
  if ((SUBETAPAS as readonly string[]).includes(key)) return key as Subetapa;
  return null;
}

export function normalizarChaveMatrix(valor?: string | null): string {
  return String(valor || '').trim().toUpperCase().replace(/\s+/g, '_');
}

export function statusClienteAoAgendarPorSubetapa(params: { subetapa?: Subetapa | string | null }): string | null {
  const subetapa = String(params.subetapa || '').trim().toUpperCase();
  switch (subetapa) {
    case 'CADASTRO': return 'CLIENTE_CADASTRADO';
    case 'MEDIDA': return 'MEDIDA_AGENDADA';
    case 'ORCAMENTO': return 'ORCAMENTO_EM_ANDAMENTO';
    case 'APRESENTACAO': return 'APRESENTACAO_AGENDADA';
    case 'FECHAMENTO': return 'CONTRATO_ASSINADO';
    case 'MEDIDA_FINA': return 'MEDIDA_FINA_AGENDADA';
    case 'GARANTIA': return 'GARANTIA';
    case 'ASSISTENCIA': return 'ASSISTENCIA';
    case 'MANUTENCAO': return 'MANUTENCAO';
    default: return null;
  }
}

export function categoriaAgendaLojaPorSubetapa(params: { subetapa?: Subetapa | string | null }): string | null {
  const subetapa = String(params.subetapa || '').trim().toUpperCase();
  switch (subetapa) {
    case 'CADASTRO': return 'CADASTRO';
    case 'MEDIDA': return 'MEDIDA';
    case 'ORCAMENTO': return 'ORCAMENTO';
    case 'APRESENTACAO': return 'APRESENTACAO';
    case 'FECHAMENTO': return 'CONTRATO';
    case 'MEDIDA_FINA': return 'MEDIDA_FINA';
    case 'PROJETO_TECNICO': return 'AGUARDANDO_PROJETO_TECNICO';
    case 'PRODUCAO':
    case 'SERVICO_CORTE_FITA_BORDA': return 'PRODUCAO_EM_ANDAMENTO';
    case 'ENTREGA':
    case 'MONTAGEM': return 'MONTAGEM_CLIENTE_AGENDADA';
    case 'GARANTIA':
    case 'ASSISTENCIA':
    case 'MANUTENCAO': return subetapa;
    default: return null;
  }
}

export function categoriaAgendaFabricaPorSubetapa(params: { subetapa?: Subetapa | string | null; execucaoEtapa?: ExecucaoEtapa | string | null }): string | null {
  const subetapa = String(params.subetapa || '').trim().toUpperCase();
  const execucao = String(params.execucaoEtapa || '').trim().toUpperCase();
  switch (subetapa) {
    case 'CADASTRO': return 'CADASTRO';
    case 'MEDIDA': return 'MEDIDA';
    case 'ORCAMENTO': return 'ORCAMENTO';
    case 'APRESENTACAO': return 'APRESENTACAO';
    case 'FECHAMENTO': return 'CONTRATO';
    case 'MEDIDA_FINA': return execucao === 'PENDENTE' ? 'AGENDAR_MEDIDA_FINA' : 'MEDIDA_FINA';
    case 'PROJETO_TECNICO': return 'PROJETO_TECNICO_EM_ANDAMENTO';
    case 'PRODUCAO':
    case 'SERVICO_CORTE_FITA_BORDA': return 'PRODUCAO_EM_ANDAMENTO';
    case 'ENTREGA':
    case 'MONTAGEM': return 'MONTAGEM_CLIENTE_AGENDADA';
    case 'GARANTIA':
    case 'ASSISTENCIA':
    case 'MANUTENCAO': return subetapa;
    default: return null;
  }
}

export function statusClienteAoConcluirSubetapa(params: { subetapa?: Subetapa | string | null }): string | null {
  const subetapa = String(params.subetapa || '').trim().toUpperCase();
  switch (subetapa) {
    case 'MEDIDA': return 'MEDIDA_REALIZADA';
    case 'APRESENTACAO': return 'ORCAMENTO_APRESENTADO';
    case 'MEDIDA_FINA': return 'AGUARDANDO_PRECIFICACAO';
    case 'PROJETO_TECNICO': return 'PROJETO_TECNICO_CONCLUIDO';
    case 'PRODUCAO': return 'AGENDAR_MONTAGEM';
    case 'MONTAGEM': return 'MONTAGEM_FINALIZADA';
    default: return null;
  }
}

export function reversaoStatusClientePorSubetapa(params: { subetapa?: Subetapa | string | null }): { statusAplicado: string; statusAnterior: string } | null {
  const subetapa = String(params.subetapa || '').trim().toUpperCase();
  switch (subetapa) {
    case 'MEDIDA': return { statusAplicado: 'MEDIDA_AGENDADA', statusAnterior: 'AGENDAR_MEDIDA' };
    case 'ORCAMENTO': return { statusAplicado: 'ORCAMENTO_EM_ANDAMENTO', statusAnterior: 'CRIAR_ORCAMENTO' };
    case 'APRESENTACAO': return { statusAplicado: 'APRESENTACAO_AGENDADA', statusAnterior: 'AGENDAR_APRESENTACAO' };
    case 'FECHAMENTO': return { statusAplicado: 'CONTRATO_ASSINADO', statusAnterior: 'VENDA_FECHADA' };
    case 'MEDIDA_FINA': return { statusAplicado: 'MEDIDA_FINA_AGENDADA', statusAnterior: 'AGENDAR_MEDIDA_FINA' };
    default: return null;
  }
}

export function proximaSubetapaDoFluxo(subetapa: Subetapa): Subetapa | null {
  return SUBETAPA_CATALOGO_POR_KEY[subetapa]?.proximaSubetapa ?? null;
}

export function subetapaTerminal(subetapa: Subetapa): boolean {
  return SUBETAPA_CATALOGO_POR_KEY[subetapa]?.terminal === true;
}

export function classificarVendaPorFluxoMatrixOuLegado(params: {
  statusVenda?: string | null;
  agendas: Array<{ subetapa?: string | null; execucao_etapa?: string | null; status?: string | null; }>;
}): ClassificacaoFluxoVenda {
  let emProducao = false;
  let finalizada = false;
  let obraVigente = false;

  for (const agenda of params.agendas) {
    const statusAgenda = normalizarChaveMatrix(agenda.status);
    if (statusAgenda === 'CANCELADO') continue;
    const subetapa = normalizarChaveMatrix(agenda.subetapa) as Subetapa | '';
    const execucao = normalizarChaveMatrix(agenda.execucao_etapa);
    const subetapaFinalizacaoConcluida = SUBETAPAS_FINALIZACAO_VENDA.has(subetapa as Subetapa) && execucao === 'CONCLUIDO';
    if (SUBETAPAS_PRODUCAO_ATIVA.has(subetapa as Subetapa) && execucao !== 'CONCLUIDO') emProducao = true;
    if (subetapaFinalizacaoConcluida) finalizada = true;
    if (SUBETAPAS_OBRA_VIGENTE.has(subetapa as Subetapa) && !subetapaFinalizacaoConcluida) obraVigente = true;
  }

  return { emProducao, finalizada, obraVigente: !finalizada && obraVigente };
}

// ============================================================
// PIPELINE CLIENTE (migrado de pipeline-cliente.ts)
// ============================================================

const _PIPELINE_CLIENTE_FASES_DATA = [
  { ordem: 1, fase: 'CADASTRO', label: 'Cadastro', cor: '#94a3b8', verificacao: (c: any) => !!c?.id },
  { ordem: 2, fase: 'MEDICAO_VENDA', label: 'Medição Inicial', cor: '#3b82f6', temAgendamento: true, verificacao: (c: any) => (c?.agendamentos_loja ?? []).length > 0 || (c?.agendamentos_fabrica ?? []).length > 0 },
  { ordem: 3, fase: 'ORCAMENTO', label: 'Orçamento', cor: '#a855f7', verificacao: (c: any) => (c?.orcamentos?.length ?? 0) > 0 },
  { ordem: 4, fase: 'CONTRATO', label: 'Contrato', cor: '#10b981', verificacao: (c: any) => (c?.contratos ?? []).some((x: any) => x?.status === 'VIGENTE') },
  { ordem: 5, fase: 'PRODUCAO_MONTAGEM', label: 'Produção/Montagem', cor: '#0d9488', verificacao: () => false },
];

export const PIPELINE_CLIENTE = _PIPELINE_CLIENTE_FASES_DATA.map((f) => ({ ...f, key: f.fase }));
export const PIPELINE_CLIENTE_FASES = PIPELINE_CLIENTE;
export const PIPELINE_CLIENTE_KEYS = PIPELINE_CLIENTE.map((p) => p.key);
export const STATUS_POS_VENDA: string[] = [];

export const OBRA_VIGENTE_STATUSES: string[] = [
  'AGENDAR_MEDIDA_FINA', 'MEDIDA_FINA_AGENDADA', 'MEDIDA_FINA_REALIZADA',
  'AGUARDANDO_PRECIFICACAO', 'AGUARDANDO_PROJETO_TECNICO',
  'PROJETO_TECNICO_EM_ANDAMENTO', 'PROJETO_TECNICO_CONCLUIDO', 'PROJETO_TECNICO_APROVADO',
  'PRODUCAO_AGENDADA', 'EM_PRODUCAO', 'PRODUCAO_FINALIZADA',
  'AGENDAR_MONTAGEM', 'MONTAGEM_AGENDADA', 'EM_MONTAGEM',
];

const _STATUS_ANTIGO_PARA_FASE_CLIENTE: Record<string, string> = {
  ATIVO: 'CADASTRO', CLIENTE_CADASTRADO: 'CADASTRO',
  AGENDAR_MEDIDA_VENDA: 'MEDICAO_VENDA', MEDIDA_AGENDADA: 'MEDICAO_VENDA',
  MEDIDA_EM_ANDAMENTO: 'MEDICAO_VENDA', MEDIDA_REALIZADA: 'MEDICAO_VENDA', MEDIDA_VENDA_REALIZADA: 'MEDICAO_VENDA',
  CRIAR_ORCAMENTO: 'ORCAMENTO', ORCAMENTO_EM_ANDAMENTO: 'ORCAMENTO', ORCAMENTO_ENVIADO: 'ORCAMENTO',
  ORCAMENTO_EM_NEGOCIACAO: 'ORCAMENTO', ORCAMENTO_APROVADO: 'ORCAMENTO', ORCAMENTO_REPROVADO: 'ORCAMENTO',
  AGENDAR_APRESENTACAO: 'ORCAMENTO', APRESENTACAO_AGENDADA: 'ORCAMENTO', ORCAMENTO_APRESENTADO: 'ORCAMENTO',
  VENDA_FECHADA: 'CONTRATO', CONTRATO_GERADO: 'CONTRATO', CONTRATO_ASSINADO: 'CONTRATO',
  AGENDAR_MEDIDA_FINA: 'CONTRATO', MEDIDA_FINA_AGENDADA: 'CONTRATO',
  MEDIDA_FINA_REALIZADA: 'PRODUCAO_MONTAGEM', AGUARDANDO_PRECIFICACAO: 'PRODUCAO_MONTAGEM',
  AGUARDANDO_PROJETO_TECNICO: 'PRODUCAO_MONTAGEM', PROJETO_TECNICO_EM_ANDAMENTO: 'PRODUCAO_MONTAGEM',
  PROJETO_TECNICO_CONCLUIDO: 'PRODUCAO_MONTAGEM', PROJETO_TECNICO_APROVADO: 'PRODUCAO_MONTAGEM',
  PRODUCAO_AGENDADA: 'PRODUCAO_MONTAGEM', EM_PRODUCAO: 'PRODUCAO_MONTAGEM',
  PRODUCAO_FINALIZADA: 'PRODUCAO_MONTAGEM', AGENDAR_MONTAGEM: 'PRODUCAO_MONTAGEM',
  MONTAGEM_AGENDADA: 'PRODUCAO_MONTAGEM', EM_MONTAGEM: 'PRODUCAO_MONTAGEM',
  MONTAGEM_FINALIZADA: 'PRODUCAO_MONTAGEM', GARANTIA: 'PRODUCAO_MONTAGEM',
  ASSISTENCIA: 'PRODUCAO_MONTAGEM', MANUTENCAO: 'PRODUCAO_MONTAGEM', ENCERRADO: 'PRODUCAO_MONTAGEM',
};

const _ORDEM_POR_KEY_CLIENTE = PIPELINE_CLIENTE.reduce<Record<string, number>>(
  (acc, item) => { acc[item.key] = item.ordem; return acc; }, {},
);

export function normalizarStatusCliente(status?: string | null): string {
  const s = String(status ?? '').trim().toUpperCase();
  return _STATUS_ANTIGO_PARA_FASE_CLIENTE[s] ?? s;
}

export function statusClienteEhValido(status?: string | null): boolean {
  return PIPELINE_CLIENTE_KEYS.includes(normalizarStatusCliente(status));
}

export function validarTransicaoStatusCliente(params: {
  atual?: string | null;
  proximo?: string | null;
}): { ok: boolean; motivo?: string } {
  const atual = normalizarStatusCliente(params.atual);
  const proximo = normalizarStatusCliente(params.proximo);
  if (!proximo) return { ok: false, motivo: 'Status de destino não informado.' };
  if (!statusClienteEhValido(proximo)) return { ok: false, motivo: `Status "${proximo}" é inválido no pipeline.` };
  if (!atual) return { ok: true };
  if (!statusClienteEhValido(atual)) return { ok: false, motivo: `Status atual "${atual}" é inválido no pipeline.` };
  if (atual === proximo) return { ok: true };
  const ordemAtual = _ORDEM_POR_KEY_CLIENTE[atual];
  const ordemProximo = _ORDEM_POR_KEY_CLIENTE[proximo];
  if (ordemProximo < ordemAtual) return { ok: false, motivo: `Transição inválida de "${atual}" para "${proximo}": retrocesso não permitido.` };
  return { ok: true };
}

// ============================================================
// PIPELINE PRODUCAO (migrado de pipeline-producao.ts)
// ============================================================

type PipelineProducaoItem = {
  key: string; label: string; fase: string; ordem: number;
  temTela: boolean; badgeClass: string; disparaComData?: string; colorFamily?: string;
};

const _PIPELINE_PRODUCAO_RAW: Array<{
  key: string; label: string; fase: string; ordem: number;
  temTela?: boolean; badgeClass?: string; disparaComData?: string; colorFamily?: string;
}> = [
  { key: 'PRODUCAO_RECEBIDA', label: 'Produção Recebida', fase: 'ABERTURA', ordem: 1, temTela: false, badgeClass: 'bg-slate-100 text-slate-700', colorFamily: 'indigo' },
  { key: 'AGENDAR_MEDIDA_FINA', label: 'Agendar medida fina', fase: 'ABERTURA', ordem: 1.2, temTela: true, badgeClass: 'bg-cyan-50 text-cyan-700', colorFamily: 'teal' },
  { key: 'MEDIDA_FINA', label: 'Medida fina agendada', fase: 'ABERTURA', ordem: 1.3, temTela: true, badgeClass: 'bg-teal-50 text-teal-700', colorFamily: 'teal' },
  { key: 'AGUARDANDO_PROJETO_TECNICO', label: 'Aguardando projeto técnico', fase: 'ABERTURA', ordem: 1.5, temTela: true, badgeClass: 'bg-violet-50 text-violet-700', colorFamily: 'violet' },
  { key: 'PROJETO_TECNICO_EM_ANDAMENTO', label: 'Projeto técnico em andamento', fase: 'EXECUCAO', ordem: 1.8, temTela: true, badgeClass: 'bg-violet-100 text-violet-800', colorFamily: 'violet' },
  { key: 'PROJETO_TECNICO_CONCLUIDO', label: 'Projeto técnico concluído', fase: 'EXECUCAO', ordem: 1.9, temTela: false, badgeClass: 'bg-emerald-50 text-emerald-700', colorFamily: 'violet' },
  { key: 'PRODUCAO_EM_ANDAMENTO', label: 'Produção', fase: 'EXECUCAO', ordem: 2, temTela: true, badgeClass: 'bg-sky-50 text-sky-700', colorFamily: 'sky' },
  { key: 'PREPARACAO_TECNICA', label: 'Preparação Técnica', fase: 'EXECUCAO', ordem: 2.1, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'CORTE', label: 'Corte / Usinagem', fase: 'EXECUCAO', ordem: 2.2, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'MONTAGEM_INTERNA', label: 'Montagem Interna', fase: 'EXECUCAO', ordem: 2.3, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'ACABAMENTO', label: 'Acabamento', fase: 'EXECUCAO', ordem: 2.4, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'CONFERENCIA_QUALIDADE', label: 'Conferência de Qualidade', fase: 'EXECUCAO', ordem: 2.5, temTela: false, badgeClass: 'bg-slate-100', colorFamily: 'sky' },
  { key: 'MONTAGEM_CLIENTE_AGENDADA', label: 'Montagem Cliente Agendada', fase: 'MONTAGEM_CLIENTE', ordem: 7, temTela: true, disparaComData: 'data_montagem_cliente', badgeClass: 'bg-amber-50 text-amber-700', colorFamily: 'amber' },
  { key: 'EM_MONTAGEM_CLIENTE', label: 'Em Montagem Cliente', fase: 'MONTAGEM_CLIENTE', ordem: 8, temTela: false, badgeClass: 'bg-orange-100 text-orange-800', colorFamily: 'amber' },
  { key: 'MONTAGEM_CLIENTE_FINALIZADA', label: 'Montagem Cliente Finalizada', fase: 'MONTAGEM_CLIENTE', ordem: 9, temTela: false, badgeClass: 'bg-emerald-100 text-emerald-800', colorFamily: 'amber' },
  { key: 'AGENDAR_POS_VENDA', label: 'Agendar Pós-Venda', fase: 'POS_VENDA', ordem: 10, temTela: true, disparaComData: 'data_visita_pos_venda', badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  { key: 'GARANTIA', label: 'Garantia', fase: 'POS_VENDA', ordem: 10.1, temTela: true, badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  { key: 'MANUTENCAO', label: 'Manutenção', fase: 'POS_VENDA', ordem: 10.2, temTela: true, badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  { key: 'ASSISTENCIA', label: 'Assistência', fase: 'POS_VENDA', ordem: 10.3, temTela: true, badgeClass: 'bg-pink-50 text-pink-700', colorFamily: 'slate' },
  { key: 'PRODUCAO_FINALIZADA', label: 'Produção Finalizada', fase: 'FINALIZACAO', ordem: 11, temTela: false, badgeClass: 'bg-green-500 text-white', colorFamily: 'indigo' },
];

export const PIPELINE_PRODUCAO: PipelineProducaoItem[] = _PIPELINE_PRODUCAO_RAW.map((p) => ({
  key: p.key, label: p.label ?? p.key, fase: p.fase, ordem: p.ordem,
  temTela: p.temTela ?? false, badgeClass: p.badgeClass ?? 'bg-slate-100 text-slate-700',
  disparaComData: p.disparaComData, colorFamily: p.colorFamily ?? 'slate',
}));

export const PIPELINE_PRODUCAO_KEYS = PIPELINE_PRODUCAO.map((p) => p.key);
export const AGENDA_FABRICA_SOMENTE_PAINEL_CATEGORIAS = ['AGENDAR_MEDIDA_FINA'] as const;
export const AGENDA_FABRICA_STATUS_AGENDADO = 'EM_ANDAMENTO';
export const AGENDA_FABRICA_STATUS_SEMPRE_VISIVEL = 'CONCLUIDO';

const _PIPELINE_PRODUCAO_ORDEM = PIPELINE_PRODUCAO.reduce<Record<string, number>>(
  (acc, p) => { acc[p.key] = p.ordem; return acc; }, {},
);

export function normalizarStatusProducao(status?: string | null): string {
  return String(status || '').trim().toUpperCase();
}

export function statusProducaoEhValido(status?: string | null): boolean {
  return PIPELINE_PRODUCAO_KEYS.includes(normalizarStatusProducao(status));
}

export function validarTransicaoStatusProducao(params: {
  atual?: string | null;
  proximo?: string | null;
}): { ok: boolean; motivo?: string } {
  const atual = normalizarStatusProducao(params.atual);
  const proximo = normalizarStatusProducao(params.proximo);
  if (!proximo) return { ok: false, motivo: 'Status de destino não informado.' };
  if (!statusProducaoEhValido(proximo)) return { ok: false, motivo: `Status "${proximo}" é inválido no pipeline de produção.` };
  if (!atual) return { ok: true };
  if (!statusProducaoEhValido(atual)) return { ok: false, motivo: `Status atual "${atual}" é inválido no pipeline de produção.` };
  if (atual === proximo) return { ok: true };
  const ordemAtual = _PIPELINE_PRODUCAO_ORDEM[atual];
  const ordemProximo = _PIPELINE_PRODUCAO_ORDEM[proximo];
  if (ordemProximo < ordemAtual) return { ok: false, motivo: `Transição inválida de "${atual}" para "${proximo}": retrocesso não é permitido.` };
  return { ok: true };
}

// ============================================================
// PIPELINE PLANO CORTE (migrado de pipeline-plano-corte.ts)
// ============================================================

type PipelinePlanoCorteItem = {
  key: string; label: string; fase: string; ordem: number;
  temTela: boolean; badgeClass: string; dotClass: string;
};

const _PLANO_CORTE_STATUS_LABELS: Record<string, string> = {
  EM_ABERTO: 'Em aberto', AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  CONFERENCIA_TECNICA: 'Conferência técnica', LIBERADO_PARA_CORTE: 'Liberado para corte',
  NA_FILA_DE_CORTE: 'Na fila de corte', EM_EXECUCAO: 'Em execução',
  PRODUCAO_FINALIZADA: 'Produção Finalizada', AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  COMPENSADO: 'Compensado', PRODUCAO_RECEBIDA: 'Produção Recebida', CORTE: 'Corte / Usinagem',
};

const _BADGE_PLANO_CORTE: Record<number, { badgeClass: string; dotClass: string }> = {
  1: { badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200', dotClass: 'bg-slate-500' },
  2: { badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200', dotClass: 'bg-amber-500' },
  3: { badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dotClass: 'bg-emerald-500' },
};

const _PLANO_CORTE_FASES = [
  { ordem: 1, fase: 'INICIO', label: 'Produção Recebida', statusInternos: ['PRODUCAO_RECEBIDA'] },
  { ordem: 2, fase: 'PRODUZINDO', label: 'Corte / Usinagem', statusInternos: ['CORTE'] },
  { ordem: 3, fase: 'FIM', label: 'Produção Finalizada', statusInternos: ['PRODUCAO_FINALIZADA'] },
];

export const PIPELINE_PLANO_CORTE: PipelinePlanoCorteItem[] = _PLANO_CORTE_FASES.flatMap((f) =>
  f.statusInternos.map((status, idx) => {
    const key = status.toUpperCase();
    const badge = _BADGE_PLANO_CORTE[f.ordem] || _BADGE_PLANO_CORTE[1];
    return {
      key, label: _PLANO_CORTE_STATUS_LABELS[key] || f.label,
      fase: f.fase, ordem: f.ordem * 100 + idx, temTela: false,
      badgeClass: badge.badgeClass, dotClass: badge.dotClass,
    };
  }),
);

export const PIPELINE_PLANO_CORTE_OPTIONS = PIPELINE_PLANO_CORTE;

// ============================================================
// PIPELINE REGRAS (migrado de pipeline-regras.ts)
// ============================================================

export const PRAZO_CLIENTE_CADASTRADO_DIAS_UTEIS = 10;
export const PRAZO_ORCAMENTO_VALIDADE_DIAS_UTEIS = 7;
export const PRAZO_FECHAR_VENDA_DIAS_UTEIS = 7;
export const PRAZO_APOS_MEDIDA_FINA_DIAS_CORRIDOS = 45;
export const PRAZO_ALERTA_VIGENCIA_DIAS = 30;

export const PRAZO_POR_FASE: Record<string, number> = {
  CADASTRO: PRAZO_CLIENTE_CADASTRADO_DIAS_UTEIS,
  ORCAMENTO: PRAZO_ORCAMENTO_VALIDADE_DIAS_UTEIS,
  FECHAR_VENDA: PRAZO_FECHAR_VENDA_DIAS_UTEIS,
};

export function addDiasUteis(base: Date, dias: number): Date {
  const d = new Date(base);
  let restantes = dias;
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6) restantes--;
  }
  return d;
}

export function addDiasCorridos(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

export function getPrazoAte(dataBase: Date, fase: string): Date | null {
  const dias = PRAZO_POR_FASE[fase];
  if (dias == null || dias <= 0) return null;
  return addDiasUteis(dataBase, dias);
}

export function getPrazoAposMedidaFina(dataConclusaoMedidaFina: Date): Date {
  return addDiasCorridos(dataConclusaoMedidaFina, PRAZO_APOS_MEDIDA_FINA_DIAS_CORRIDOS);
}

export function getDataCorteContasReceber(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}