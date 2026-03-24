export const TWIN_FLOW_CONTEXTS = ['STORE', 'FACTORY'] as const;
export const TWIN_FLOW_SCHEDULE_TYPES = ['AGENDA_LOJA', 'AGENDA_FABRICA'] as const;

export type TwinFlowContext = (typeof TWIN_FLOW_CONTEXTS)[number];
export type TwinFlowScheduleType = (typeof TWIN_FLOW_SCHEDULE_TYPES)[number];

export interface IEntityStatus {
  flowContext: TwinFlowContext;
  status: string;
  subStep: string;
  macroStage: string | null;
  executionStatus: string | null;
  stepLabel: string;
  order: number | null;
  terminal: boolean;
  sourceType?: string | null;
  sourceId?: number | null;
}

export type TwinFlowStepDefinition = {
  subStep: string;
  label: string;
  macroStage: string;
  order: number;
  terminal?: boolean;
};

export const STORE_FLOW: readonly TwinFlowStepDefinition[] = [
  { subStep: 'CADASTRO', label: 'Cadastro', macroStage: 'COMERCIAL', order: 10 },
  { subStep: 'MEDIDA', label: 'Medição inicial', macroStage: 'COMERCIAL', order: 20 },
  { subStep: 'ORCAMENTO', label: 'Orçamento', macroStage: 'COMERCIAL', order: 30 },
  { subStep: 'APRESENTACAO', label: 'Apresentação', macroStage: 'COMERCIAL', order: 40 },
  { subStep: 'FECHAMENTO', label: 'Fechamento da venda', macroStage: 'COMERCIAL', order: 50 },
  { subStep: 'ENTREGA', label: 'Entrega comercial', macroStage: 'LOGISTICA', order: 60, terminal: true },
] as const;

export const FACTORY_FLOW: readonly TwinFlowStepDefinition[] = [
  { subStep: 'MEDIDA_FINA', label: 'Medida fina', macroStage: 'ENGENHARIA', order: 10 },
  { subStep: 'PROJETO_TECNICO', label: 'Projeto técnico', macroStage: 'ENGENHARIA', order: 20 },
  { subStep: 'PRODUCAO', label: 'Produção', macroStage: 'FABRICA', order: 30 },
  { subStep: 'SERVICO_CORTE_FITA_BORDA', label: 'Serviço de corte e fita de borda', macroStage: 'FABRICA', order: 35, terminal: true },
  { subStep: 'ENTREGA', label: 'Material carregado', macroStage: 'LOGISTICA', order: 40 },
  { subStep: 'MONTAGEM', label: 'Montagem', macroStage: 'LOGISTICA', order: 50 },
  { subStep: 'GARANTIA', label: 'Garantia', macroStage: 'POS_VENDA', order: 60, terminal: true },
  { subStep: 'ASSISTENCIA', label: 'Assistência', macroStage: 'POS_VENDA', order: 61, terminal: true },
  { subStep: 'MANUTENCAO', label: 'Manutenção', macroStage: 'POS_VENDA', order: 62, terminal: true },
] as const;

const STORE_FLOW_BY_SUBSTEP = new Map(STORE_FLOW.map((item) => [item.subStep, item]));
const FACTORY_FLOW_BY_SUBSTEP = new Map(FACTORY_FLOW.map((item) => [item.subStep, item]));

const STORE_STATUS_TO_SUBSTEP: Record<string, string> = {
  ATIVO: 'CADASTRO',
  CLIENTE_CADASTRADO: 'CADASTRO',
  AGENDAR_MEDIDA: 'MEDIDA',
  AGENDAR_MEDIDA_VENDA: 'MEDIDA',
  MEDIDA_AGENDADA: 'MEDIDA',
  MEDIDA_REALIZADA: 'MEDIDA',
  CRIAR_ORCAMENTO: 'ORCAMENTO',
  ORCAMENTO_EM_ANDAMENTO: 'ORCAMENTO',
  ORCAMENTO_APROVADO: 'ORCAMENTO',
  AGENDAR_APRESENTACAO: 'APRESENTACAO',
  APRESENTACAO_AGENDADA: 'APRESENTACAO',
  ORCAMENTO_APRESENTADO: 'APRESENTACAO',
  VENDA_FECHADA: 'FECHAMENTO',
  CONTRATO_GERADO: 'FECHAMENTO',
  CONTRATO_ASSINADO: 'FECHAMENTO',
  ENTREGA_AGENDADA: 'ENTREGA',
  ENTREGA_FINALIZADA: 'ENTREGA',
};

const STORE_LEGACY_TO_SUBSTEP: Record<string, string> = {
  MEDIDA_FINA: 'FECHAMENTO',
  PROJETO_TECNICO: 'FECHAMENTO',
  PRODUCAO: 'FECHAMENTO',
  SERVICO_CORTE_FITA_BORDA: 'FECHAMENTO',
  MONTAGEM: 'FECHAMENTO',
  GARANTIA: 'FECHAMENTO',
  ASSISTENCIA: 'FECHAMENTO',
  MANUTENCAO: 'FECHAMENTO',
};

export const STORE_FACTORY_START_TRIGGER_STATUSES = ['VENDA_FECHADA', 'CONTRATO_ASSINADO'] as const;

export function normalizeTwinFlowContext(value?: string | null): TwinFlowContext | null {
  const key = String(value || '').trim().toUpperCase();
  if ((TWIN_FLOW_CONTEXTS as readonly string[]).includes(key)) return key as TwinFlowContext;
  return null;
}

export function getTwinFlowConfig(context: TwinFlowContext): readonly TwinFlowStepDefinition[] {
  return context === 'STORE' ? STORE_FLOW : FACTORY_FLOW;
}

export function getTwinFlowDefinition(
  context: TwinFlowContext,
  subStep?: string | null,
): TwinFlowStepDefinition | null {
  const key = String(subStep || '').trim().toUpperCase();
  if (!key) return null;
  return context === 'STORE'
    ? STORE_FLOW_BY_SUBSTEP.get(key) || null
    : FACTORY_FLOW_BY_SUBSTEP.get(key) || null;
}

export function normalizeStoreTwinSubStep(params: {
  subStep?: string | null;
  status?: string | null;
}): string {
  const rawSubStep = String(params.subStep || '').trim().toUpperCase();
  if (STORE_FLOW_BY_SUBSTEP.has(rawSubStep)) return rawSubStep;
  if (STORE_LEGACY_TO_SUBSTEP[rawSubStep]) return STORE_LEGACY_TO_SUBSTEP[rawSubStep];
  const rawStatus = String(params.status || '').trim().toUpperCase();
  if (STORE_STATUS_TO_SUBSTEP[rawStatus]) return STORE_STATUS_TO_SUBSTEP[rawStatus];
  return 'CADASTRO';
}

export function normalizeFactoryTwinSubStep(params: {
  subStep?: string | null;
  status?: string | null;
}): string {
  const rawSubStep = String(params.subStep || '').trim().toUpperCase();
  if (FACTORY_FLOW_BY_SUBSTEP.has(rawSubStep)) return rawSubStep;
  const rawStatus = String(params.status || '').trim().toUpperCase();
  if (rawStatus === 'PRODUCAO_FINALIZADA' || rawStatus === 'EM_PRODUCAO') return 'PRODUCAO';
  if (rawStatus === 'MONTAGEM_AGENDADA' || rawStatus === 'EM_MONTAGEM') return 'MONTAGEM';
  if (rawStatus === 'AGUARDANDO_PROJETO_TECNICO' || rawStatus === 'PROJETO_TECNICO_EM_ANDAMENTO') return 'PROJETO_TECNICO';
  return 'PRODUCAO';
}

export function buildTwinEntityStatus(params: {
  context: TwinFlowContext;
  status?: string | null;
  subStep?: string | null;
  macroStage?: string | null;
  executionStatus?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
}): IEntityStatus {
  const normalizedSubStep = params.context === 'STORE'
    ? normalizeStoreTwinSubStep({ subStep: params.subStep, status: params.status })
    : normalizeFactoryTwinSubStep({ subStep: params.subStep, status: params.status });
  const definition = getTwinFlowDefinition(params.context, normalizedSubStep);
  return {
    flowContext: params.context,
    status: String(params.status || '').trim().toUpperCase() || 'PENDENTE',
    subStep: normalizedSubStep,
    macroStage: params.macroStage || definition?.macroStage || null,
    executionStatus: params.executionStatus ? String(params.executionStatus).trim().toUpperCase() : null,
    stepLabel: definition?.label || normalizedSubStep,
    order: definition?.order ?? null,
    terminal: definition?.terminal === true,
    sourceType: params.sourceType || null,
    sourceId: params.sourceId ?? null,
  };
}

export function shouldStartFactoryFlowFromStoreStatus(snapshot: Pick<IEntityStatus, 'status' | 'subStep'>): boolean {
  const status = String(snapshot.status || '').trim().toUpperCase();
  if ((STORE_FACTORY_START_TRIGGER_STATUSES as readonly string[]).includes(status)) return true;
  return String(snapshot.subStep || '').trim().toUpperCase() === 'FECHAMENTO';
}