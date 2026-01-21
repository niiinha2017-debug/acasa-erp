// src/constantes/pipeline.js
import { PIPELINE_CLIENTE } from './pipeline-cliente'

export function getPipelineCompleto() {
  return [...PIPELINE_CLIENTE].sort((a, b) => a.ordem - b.ordem)
}

export function getPipelinePorFase(fase) {
  return getPipelineCompleto().filter(p => p.fase === fase)
}

export function getPipelineAte(key) {
  const alvo = getPipelineCompleto().find(p => p.key === key)
  if (!alvo) return []
  return getPipelineCompleto().filter(p => p.ordem <= alvo.ordem)
}

export function getPipelinePorKeys(keys = []) {
  return getPipelineCompleto().filter(p => keys.includes(p.key))
}
