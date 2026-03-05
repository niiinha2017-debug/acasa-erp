/**
 * Módulo único de cores/classes por etapa e status.
 * Consome GET /utils/status-colors do backend (fonte única de regras e classes).
 * Usa fallback mínimo enquanto a API não carrega ou em caso de erro.
 */

let _config = null

/** Labels das 11 etapas oficiais (para fallback e lista completa antes da API). */
const ETAPAS_LABELS = [
  { ordem: 1, key: 'CADASTRO', label: 'Cadastro' },
  { ordem: 2, key: 'MEDICAO', label: 'Medição' },
  { ordem: 3, key: 'ORCAMENTO', label: 'Orçamento' },
  { ordem: 4, key: 'AGENDAR_APRESENTACAO', label: 'Agendar Apresentação' },
  { ordem: 5, key: 'FECHAR_VENDA', label: 'Fechar Venda' },
  { ordem: 6, key: 'AGENDAR_FECHAMENTO', label: 'Agendar Fechamento' },
  { ordem: 7, key: 'MEDIDA_FINA', label: 'Medida Fina' },
  { ordem: 8, key: 'PROJETO_TECNICO', label: 'Projeto Técnico' },
  { ordem: 9, key: 'PRODUCAO', label: 'Produção' },
  { ordem: 10, key: 'MONTAGEM', label: 'Montagem' },
  { ordem: 11, key: 'POS_VENDA_GARANTIA', label: 'Pós-Venda/Garantia' },
]

/** Fallback mínimo (classes slate; lista de etapas completa) para uso antes da API ou em erro. */
function getDefaultConfig() {
  const slate = {
    borderLeft: 'border-l-8 border-slate-400',
    badgeTime: 'bg-slate-400/10 text-slate-400',
    dot: 'bg-slate-400',
    hoverBg: 'hover:bg-slate-50',
    borderBottom: 'border-b-4 border-slate-400',
    lineBg: '!bg-slate-400',
    dotBorder: 'border-slate-400',
  }
  const statusTarefa = {
    pendente: 'border-l-4 border-slate-500',
    em_andamento: 'border-l-4 border-slate-600',
    pausado: 'border-l-4 border-slate-300',
    concluido: 'border-l-4 border-slate-700',
  }
  const badgeStatus = 'bg-slate-500/10 text-slate-500'
  const dotStatus = 'bg-slate-500'
  const execucao = {
    agendado: 'border-l-slate-300 bg-slate-50/80 dark:bg-slate-800/30 dark:border-l-slate-600',
    em_andamento: 'border-l-slate-500 bg-slate-100/80 dark:bg-slate-800/50 dark:border-l-slate-500',
    concluido: 'border-l-slate-700 bg-slate-100/50 dark:bg-slate-800/40 dark:border-l-slate-700',
  }
  const badgeExec = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700'
  const calendarPendente = 'bg-slate-500 hover:bg-slate-600'
  const calendarEmAndamento = 'bg-slate-600 hover:bg-slate-500'
  const calendarPausado = 'bg-slate-300 hover:bg-slate-400'
  const calendarConcluido = 'bg-slate-700 hover:bg-slate-600'
  const titulo = 'text-gray-500'
  const dotState = 'border-gray-300 bg-gray-100 dark:border-slate-600'

  const keys = ETAPAS_LABELS.map((e) => e.key)
  const borderLeft = {}
  const badgeTime = {}
  const dot = {}
  const hoverBg = {}
  const borderBottom = {}
  const lineBg = {}
  const dotBorder = {}
  const borderL4ByStatus = {}
  const badgeTempoByStatus = {}
  const dotByStatus = {}
  const calendarEventVendas = {}
  const calendarEventProducao = {}
  const cardBorderVendas = {}
  const cardBorderProducao = {}
  const badgeVendas = {}
  const badgeProducao = {}
  const tituloCardByEtapa = {}
  const dotEtapaByState = {}
  keys.forEach((k) => {
    borderLeft[k] = slate.borderLeft
    badgeTime[k] = slate.badgeTime
    dot[k] = slate.dot
    hoverBg[k] = slate.hoverBg
    borderBottom[k] = slate.borderBottom
    lineBg[k] = slate.lineBg
    dotBorder[k] = slate.dotBorder
    borderL4ByStatus[k] = statusTarefa
    badgeTempoByStatus[k] = { pendente: badgeStatus, em_andamento: badgeStatus, pausado: badgeStatus, concluido: badgeStatus }
    dotByStatus[k] = { pendente: dotStatus, em_andamento: dotStatus, pausado: dotStatus, concluido: dotStatus }
    calendarEventVendas[k] = {
      pendente: calendarPendente,
      em_andamento: calendarEmAndamento,
      pausado: calendarPausado,
      concluido: calendarConcluido,
    }
    calendarEventProducao[k] = {
      pendente: calendarPendente,
      em_andamento: calendarEmAndamento,
      pausado: calendarPausado,
      concluido: calendarConcluido,
    }
    cardBorderVendas[k] = execucao
    cardBorderProducao[k] = execucao
    badgeVendas[k] = { agendado: badgeExec, em_andamento: badgeExec, concluido: badgeExec }
    badgeProducao[k] = { agendado: badgeExec, em_andamento: badgeExec, concluido: badgeExec }
    tituloCardByEtapa[k] = { agendado: titulo, em_andamento: titulo, concluido: titulo }
    dotEtapaByState[k] = { agendado: dotState, em_andamento: dotState, concluido: dotState }
  })

  return {
    etapaKeys: keys,
    categoriasProjetoTecnico: [
      'AGUARDANDO_PROJETO_TECNICO',
      'PROJETO_TECNICO_EM_ANDAMENTO',
      'PROJETO_TECNICO_CONCLUIDO',
      'PROJETO_TECNICO_APROVADO',
    ],
    categoriaToEtapaKey: {},
    etapasOficial: [...ETAPAS_LABELS],
    vendasEtapaKeys: keys.slice(0, 6),
    producaoEtapaKeys: keys.slice(6, 11),
    borderLeft,
    badgeTime,
    dot,
    hoverBg,
    borderBottom,
    lineBg,
    dotBorder,
    borderL4ByStatus,
    badgeTempoByStatus,
    dotByStatus,
    calendarEventVendas,
    calendarEventProducao,
    cardBorderVendas,
    cardBorderProducao,
    badgeVendas,
    badgeProducao,
    tituloCardByEtapa,
    dotEtapaByState,
  }
}

function getConfig() {
  return _config || getDefaultConfig()
}

/**
 * Carrega a config de etapas/cores do backend. Chamar no bootstrap do app (ex.: após login ou no main).
 * @param {import('axios').AxiosInstance} api - instância do axios (api.js)
 * @returns {Promise<object>}
 */
export function loadStatusColorsConfig(api) {
  if (!api || !api.get) return Promise.resolve(getDefaultConfig())
  return api
    .get('/utils/status-colors')
    .then((res) => {
      if (res?.data) _config = res.data
      return getConfig()
    })
    .catch(() => getConfig())
}

// ---------------------------------------------------------------------------
// Normalização de status
// ---------------------------------------------------------------------------

/** Normaliza status de execução para agendado | em_andamento | concluido. */
export function normalizarStatusSaturacao(status) {
  const s = String(status ?? '').trim().toUpperCase()
  if (s === 'CONCLUIDO' || s === 'CONCLUÍDO') return 'concluido'
  if (s === 'EM_ANDAMENTO' || s === 'PAUSADO') return 'em_andamento'
  return 'agendado'
}

/** Normaliza status da tarefa para pendente | em_andamento | pausado | concluido. */
export function normalizarStatusTarefa(status) {
  const s = String(status ?? '').trim().toUpperCase()
  if (s === 'CONCLUIDO' || s === 'CONCLUÍDO') return 'concluido'
  if (s === 'PAUSADO') return 'pausado'
  if (s === 'EM_ANDAMENTO' || s === 'EM ANDAMENTO') return 'em_andamento'
  return 'pendente'
}

// ---------------------------------------------------------------------------
// Etapas e chaves
// ---------------------------------------------------------------------------

function getEtapaKey(categoriaOuStatus) {
  const c = getConfig()
  const key = String(categoriaOuStatus || '').trim().toUpperCase().replace(/\s+/g, '_')
  if (c.etapaKeys.includes(key)) return key
  if (c.categoriasProjetoTecnico.includes(key)) return 'PROJETO_TECNICO'
  return c.categoriaToEtapaKey[key] || 'CADASTRO'
}

/** Retorna a chave da etapa a partir da categoria (agenda/status). */
export function getEtapaKeyByCategoria(categoria) {
  if (!categoria) return 'CADASTRO'
  const key = String(categoria).trim().toUpperCase().replace(/\s+/g, '_')
  const c = getConfig()
  return c.categoriaToEtapaKey[key] || 'CADASTRO'
}

/** Retorna objeto da etapa oficial por categoria. */
export function getEtapaByCategoria(categoria) {
  const key = getEtapaKeyByCategoria(categoria)
  const c = getConfig()
  return c.etapasOficial.find((e) => e.key === key) || c.etapasOficial[0]
}

function getByKey(mapKey, categoriaOuStatus) {
  const c = getConfig()
  const map = c[mapKey] || {}
  const key = getEtapaKey(categoriaOuStatus)
  return map[key] || map.CADASTRO
}

// ---------------------------------------------------------------------------
// Classes por etapa (genérico)
// ---------------------------------------------------------------------------

export function getStatusColor(categoriaOuStatus) {
  const c = getConfig()
  const key = getEtapaKey(categoriaOuStatus)
  const badge = c.badgeTime[key] || c.badgeTime.CADASTRO || ''
  const parts = badge.split(' ')
  return {
    borderLeft: getByKey('borderLeft', categoriaOuStatus),
    badgeBg: parts[0] || '',
    badgeText: parts[1] || '',
    badgeTime: badge,
    dot: getByKey('dot', categoriaOuStatus),
    hoverBg: getByKey('hoverBg', categoriaOuStatus),
    borderBottom: getByKey('borderBottom', categoriaOuStatus),
  }
}

export function getStatusBorderLeftClass(categoriaOuStatus) {
  return getByKey('borderLeft', categoriaOuStatus)
}

export function getStatusBadgeTimeClass(categoriaOuStatus) {
  return getByKey('badgeTime', categoriaOuStatus)
}

export function getStatusDotClass(categoriaOuStatus) {
  return getByKey('dot', categoriaOuStatus)
}

export function getStatusHoverBgClass(categoriaOuStatus) {
  return getByKey('hoverBg', categoriaOuStatus)
}

export function getStatusBorderBottomClass(categoriaOuStatus) {
  return getByKey('borderBottom', categoriaOuStatus)
}

export function getStatusLineBgClass(etapaKey) {
  const c = getConfig()
  return c.lineBg[etapaKey] || c.lineBg.CADASTRO
}

export function getStatusStepperDotClass(etapaKey) {
  const c = getConfig()
  return c.dotBorder[etapaKey] || c.dotBorder.CADASTRO
}

export function getPrazoTextClass(estaAtrasado) {
  return estaAtrasado ? 'text-red-500' : 'text-emerald-500'
}

export function getStatusEtapaKey(categoriaOuStatus) {
  return getEtapaKey(categoriaOuStatus)
}

// ---------------------------------------------------------------------------
// Processo por status da tarefa (timeline: pendente / em_andamento / pausado / concluido)
// ---------------------------------------------------------------------------

function getProcessColorByStatusInternal(etapaKey, statusTarefa) {
  const c = getConfig()
  const status = normalizarStatusTarefa(statusTarefa)
  const borderMap = c.borderL4ByStatus[etapaKey] || c.borderL4ByStatus.CADASTRO
  const badgeMap = c.badgeTempoByStatus[etapaKey] || c.badgeTempoByStatus.CADASTRO
  const dotMap = c.dotByStatus[etapaKey] || c.dotByStatus.CADASTRO
  return {
    borderLeftClass: borderMap[status] || borderMap.pendente,
    badgeClass: badgeMap[status] || badgeMap.pendente,
    dotClass: dotMap[status] || dotMap.pendente,
    pulse: status === 'em_andamento',
  }
}

export function getProcessColorByStatus(categoria, statusTarefa) {
  const etapaKey = getEtapaKey(categoria)
  return getProcessColorByStatusInternal(etapaKey, statusTarefa)
}

/** Na timeline, cards concluídos exibem a cor da etapa (tom 700) para identificar o tipo de tarefa. */
const TIMELINE_CONCLUIDO_BY_ETAPA = {
  CADASTRO: { borderLeftClass: 'border-l-4 border-slate-700', dotClass: 'bg-slate-700', badgeClass: 'bg-slate-700/10 text-slate-700 dark:bg-slate-600/20 dark:text-slate-300' },
  MEDICAO: { borderLeftClass: 'border-l-4 border-blue-700', dotClass: 'bg-blue-700', badgeClass: 'bg-blue-700/10 text-blue-700 dark:bg-blue-600/20 dark:text-blue-300' },
  ORCAMENTO: { borderLeftClass: 'border-l-4 border-amber-700', dotClass: 'bg-amber-700', badgeClass: 'bg-amber-700/10 text-amber-700 dark:bg-amber-600/20 dark:text-amber-300' },
  AGENDAR_APRESENTACAO: { borderLeftClass: 'border-l-4 border-indigo-700', dotClass: 'bg-indigo-700', badgeClass: 'bg-indigo-700/10 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-300' },
  FECHAR_VENDA: { borderLeftClass: 'border-l-4 border-emerald-700', dotClass: 'bg-emerald-700', badgeClass: 'bg-emerald-700/10 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300' },
  AGENDAR_FECHAMENTO: { borderLeftClass: 'border-l-4 border-lime-700', dotClass: 'bg-lime-700', badgeClass: 'bg-lime-700/10 text-lime-700 dark:bg-lime-600/20 dark:text-lime-300' },
  MEDIDA_FINA: { borderLeftClass: 'border-l-4 border-purple-700', dotClass: 'bg-purple-700', badgeClass: 'bg-purple-700/10 text-purple-700 dark:bg-purple-600/20 dark:text-purple-300' },
  PROJETO_TECNICO: { borderLeftClass: 'border-l-4 border-pink-700', dotClass: 'bg-pink-700', badgeClass: 'bg-pink-700/10 text-pink-700 dark:bg-pink-600/20 dark:text-pink-300' },
  PRODUCAO: { borderLeftClass: 'border-l-4 border-orange-700', dotClass: 'bg-orange-700', badgeClass: 'bg-orange-700/10 text-orange-700 dark:bg-orange-600/20 dark:text-orange-300' },
  MONTAGEM: { borderLeftClass: 'border-l-4 border-cyan-700', dotClass: 'bg-cyan-700', badgeClass: 'bg-cyan-700/10 text-cyan-700 dark:bg-cyan-600/20 dark:text-cyan-300' },
  POS_VENDA_GARANTIA: { borderLeftClass: 'border-l-4 border-fuchsia-700', dotClass: 'bg-fuchsia-700', badgeClass: 'bg-fuchsia-700/10 text-fuchsia-700 dark:bg-fuchsia-600/20 dark:text-fuchsia-300' },
}

export function getTimelineConcluidoClass(categoria) {
  const etapaKey = getEtapaKey(categoria)
  const c = getConfig()
  const vendasKeys = c.vendasEtapaKeys || []
  const producaoKeys = c.producaoEtapaKeys || []
  const key = vendasKeys.includes(etapaKey)
    ? etapaKey
    : producaoKeys.includes(etapaKey)
      ? etapaKey
      : vendasKeys[vendasKeys.length - 1] || producaoKeys[0] || 'CADASTRO'
  return TIMELINE_CONCLUIDO_BY_ETAPA[key] || TIMELINE_CONCLUIDO_BY_ETAPA.CADASTRO
}

function clampToVendasEtapa(etapaKey) {
  const c = getConfig()
  return c.vendasEtapaKeys.includes(etapaKey)
    ? etapaKey
    : c.vendasEtapaKeys[c.vendasEtapaKeys.length - 1] || 'AGENDAR_FECHAMENTO'
}

function clampToProducaoEtapa(etapaKey) {
  const c = getConfig()
  return c.producaoEtapaKeys.includes(etapaKey) ? etapaKey : c.producaoEtapaKeys[0] || 'MEDIDA_FINA'
}

export function getProcessColorByStatusVendas(categoria, statusTarefa) {
  const etapaKey = clampToVendasEtapa(getEtapaKey(categoria))
  return getProcessColorByStatusInternal(etapaKey, statusTarefa)
}

export function getProcessColorByStatusProducao(categoria, statusTarefa) {
  const etapaKey = clampToProducaoEtapa(getEtapaKey(categoria))
  return getProcessColorByStatusInternal(etapaKey, statusTarefa)
}

// ---------------------------------------------------------------------------
// Calendário e cards (agenda vendas / produção)
// ---------------------------------------------------------------------------

/** concluidoOrStatus: boolean (true=concluido, false=em_andamento) ou string do status (PENDENTE/EM_ANDAMENTO/PAUSADO/CONCLUIDO) para tons 500/600/300/700. */
export function getCalendarioEventClassVendas(categoria, concluidoOrStatus) {
  const c = getConfig()
  const etapa = clampToVendasEtapa(getEtapaKey(categoria))
  const sat =
    typeof concluidoOrStatus === 'string'
      ? normalizarStatusTarefa(concluidoOrStatus)
      : concluidoOrStatus
        ? 'concluido'
        : 'em_andamento'
  const map = c.calendarEventVendas[etapa] || c.calendarEventVendas[c.vendasEtapaKeys[c.vendasEtapaKeys.length - 1]]
  return map?.[sat] || map?.em_andamento
}

/** concluidoOrStatus: boolean ou string do status para tons 500/600/300/700. */
export function getCalendarioEventClassProducao(categoria, concluidoOrStatus) {
  const c = getConfig()
  const etapa = clampToProducaoEtapa(getEtapaKey(categoria))
  const sat =
    typeof concluidoOrStatus === 'string'
      ? normalizarStatusTarefa(concluidoOrStatus)
      : concluidoOrStatus
        ? 'concluido'
        : 'em_andamento'
  const map = c.calendarEventProducao[etapa] || c.calendarEventProducao[c.producaoEtapaKeys[0]]
  return map?.[sat] || map?.em_andamento
}

export function getCardBorderClassVendas(categoria, statusExecucao) {
  const c = getConfig()
  const etapa = clampToVendasEtapa(getEtapaKey(categoria))
  const sat = normalizarStatusSaturacao(statusExecucao)
  const map = c.cardBorderVendas[etapa] || c.cardBorderVendas[c.vendasEtapaKeys[c.vendasEtapaKeys.length - 1]]
  return map?.[sat] || map?.em_andamento
}

export function getCardBorderClassProducao(categoria, statusExecucao) {
  const c = getConfig()
  const etapa = clampToProducaoEtapa(getEtapaKey(categoria))
  const sat = normalizarStatusSaturacao(statusExecucao)
  const map = c.cardBorderProducao[etapa] || c.cardBorderProducao[c.producaoEtapaKeys[0]]
  return map?.[sat] || map?.em_andamento
}

export function getBadgeClassVendas(categoria, statusExecucao) {
  const c = getConfig()
  const etapa = clampToVendasEtapa(getEtapaKey(categoria))
  const sat = normalizarStatusSaturacao(statusExecucao)
  const map = c.badgeVendas[etapa] || c.badgeVendas[c.vendasEtapaKeys[c.vendasEtapaKeys.length - 1]]
  return map?.[sat] || map?.em_andamento
}

export function getBadgeClassProducao(categoria, statusExecucao) {
  const c = getConfig()
  const etapa = clampToProducaoEtapa(getEtapaKey(categoria))
  const sat = normalizarStatusSaturacao(statusExecucao)
  const map = c.badgeProducao[etapa] || c.badgeProducao[c.producaoEtapaKeys[0]]
  return map?.[sat] || map?.em_andamento
}

// ---------------------------------------------------------------------------
// Badge/Card/Título por etapa (genérico – usa vendas ou produção conforme etapa)
// ---------------------------------------------------------------------------

export function getBadgeClassEtapa(categoria, statusExecucao) {
  const etapaKey = getEtapaKey(categoria)
  const c = getConfig()
  const sat = normalizarStatusSaturacao(statusExecucao)
  const mapV = c.badgeVendas[etapaKey]
  const mapP = c.badgeProducao[etapaKey]
  const map = mapV || mapP || c.badgeVendas.CADASTRO
  return map?.[sat] || map?.em_andamento
}

export function getCardBorderClassEtapa(categoria, statusExecucao) {
  const etapaKey = getEtapaKey(categoria)
  const c = getConfig()
  const sat = normalizarStatusSaturacao(statusExecucao)
  const mapV = c.cardBorderVendas[etapaKey]
  const mapP = c.cardBorderProducao[etapaKey]
  const map = mapV || mapP || c.cardBorderVendas.CADASTRO
  return map?.[sat] || map?.em_andamento
}

export function getTituloCardClassEtapa(categoria, statusExecucao) {
  const etapaKey = getEtapaKey(categoria)
  const c = getConfig()
  const sat = normalizarStatusSaturacao(statusExecucao)
  const map = c.tituloCardByEtapa?.[etapaKey] || c.tituloCardByEtapa?.CADASTRO
  return map?.[sat] || map?.em_andamento
}

/** Calendário genérico (um mapa por etapa). */
export function getCalendarioEventClass(categoria, concluido) {
  const etapaKey = getEtapaKey(categoria)
  const c = getConfig()
  const sat = concluido ? 'concluido' : 'em_andamento'
  const mapV = c.calendarEventVendas[etapaKey]
  const mapP = c.calendarEventProducao[etapaKey]
  const map = mapV || mapP || c.calendarEventVendas.CADASTRO
  return map?.[sat] || map?.em_andamento
}

/** Dot da timeline por etapa e estado (agendado | em_andamento | concluido). */
export function getDotClassEtapa(etapaKey, state) {
  const c = getConfig()
  const byState = c.dotEtapaByState?.[etapaKey] || c.dotEtapaByState?.CADASTRO
  const base = byState?.[state] || byState?.agendado
  if (state === 'em_andamento') {
    return `bg-white dark:bg-slate-900 border-2 ${base || 'bg-slate-500 border-slate-500'} shadow-[0_0_8px_rgba(0,0,0,0.15)]`
  }
  if (state === 'concluido') {
    return `${base || 'bg-slate-700 border-slate-700'} border-2`
  }
  return `bg-white dark:bg-slate-900 border-2 ${base || 'border-slate-300 bg-slate-100'} dark:border-slate-600`
}

/** Texto do passo na timeline. */
export function getStepTextClassEtapa(etapaKey, state) {
  if (state === 'em_andamento') return 'text-slate-800 dark:text-slate-100 font-bold'
  if (state === 'concluido') return 'text-slate-500 dark:text-slate-400'
  return 'text-slate-400 dark:text-slate-500'
}

// ---------------------------------------------------------------------------
// Export para compatibilidade: lista de etapas
// ---------------------------------------------------------------------------

/** Retorna a lista de etapas oficiais (do backend após loadStatusColorsConfig). */
export function getEtapasOficial() {
  return getConfig().etapasOficial
}

/** Lista de etapas oficiais (fallback com 11 etapas; após API usa getConfig().etapasOficial). */
export const ETAPAS_OFICIAL_10 = ETAPAS_LABELS

/** Chaves das etapas. */
export const ETAPA_KEYS = ETAPAS_LABELS.map((e) => e.key)
