export function normalizeTwinFlowItem(flow) {
  if (!flow) return null
  const entityStatus = flow.entityStatus || {}
  return {
    id: flow.id ?? null,
    context: String(flow.context || entityStatus.flowContext || '').toUpperCase(),
    status: String(entityStatus.status || '').toUpperCase(),
    subStep: String(entityStatus.subStep || '').toUpperCase(),
    macroStage: entityStatus.macroStage || null,
    executionStatus: entityStatus.executionStatus || null,
    stepLabel: entityStatus.stepLabel || entityStatus.subStep || '',
    order: Number.isFinite(Number(entityStatus.order)) ? Number(entityStatus.order) : null,
    terminal: Boolean(entityStatus.terminal),
    schedules: Array.isArray(flow.schedules) ? flow.schedules : [],
    history: Array.isArray(flow.history) ? flow.history : [],
  }
}

export function buildTwinFlowMap(flows) {
  return (Array.isArray(flows) ? flows : [])
    .map(normalizeTwinFlowItem)
    .filter(Boolean)
    .reduce((acc, item) => {
      acc[item.context] = item
      return acc
    }, {})
}

export function getTwinFlowProgressLabel(flow) {
  const item = normalizeTwinFlowItem(flow)
  if (!item) return ''
  return item.stepLabel || item.subStep || item.status
}
