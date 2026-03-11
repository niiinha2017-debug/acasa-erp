// frontend/src/utils/ponto.js

export function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

export function parseISODate(iso) {
  const [y, m, dd] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, dd))
}

export function listDays(inicioISO, fimISO) {
  const start = parseISODate(inicioISO)
  const end = parseISODate(fimISO)
  const days = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(toISODate(d))
  }
  return days
}

/** Data no fuso America/Sao_Paulo (YYYY-MM-DD) para agrupar registros corretamente */
function dateKeyBR(dateOrIso) {
  const d = new Date(dateOrIso)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function groupRegistrosByDia(registros = []) {
  const map = new Map()
  for (const r of registros) {
    const dia = dateKeyBR(r.data_hora)
    if (!map.has(dia)) map.set(dia, [])
    map.get(dia).push(r)
  }
  return map
}

export function groupJustificativasByDia(justificativas = []) {
  const map = new Map()
  for (const j of justificativas) {
    const dia = j.data // <-- depois a gente ajusta pro campo real da sua justificativa
    if (!dia) continue
    if (!map.has(dia)) map.set(dia, [])
    map.get(dia).push(j)
  }
  return map
}

// --- Motor de Ponto (A Casa): minutos absolutos, pares E/S, jornada 8.5h = 510 min ---
/** Jornada padrão em minutos (8h30). */
export const JORNADA_META_MIN = 510

/**
 * Converte "HH:mm" ou "HH:mm:ss" em minutos totais desde 00:00.
 * @param {string} hhmm - Ex: "08:30", "17:45"
 * @returns {number}
 */
export function hhmmParaMinutos(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const parts = String(hhmm).trim().split(/[:\s]/).map(Number)
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  const s = Number(parts[2]) || 0
  return h * 60 + m + s / 60
}

/**
 * Converte minutos (desde 00:00) em "HH:mm". Se negativo, retorna "-HH:mm".
 * @param {number} min
 * @returns {string}
 */
export function minutosParaHHMM(min) {
  const isNeg = min < 0
  const abs = Math.abs(Math.round(min))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${isNeg ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Formata data_hora ISO para hora local "HH:mm" (America/Sao_Paulo).
 */
function fmtHoraLocalPonto(iso) {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Motor de cálculo por dia: soma todos os intervalos entre ENTRADA e SAÍDA (em ordem cronológica).
 * Ex.: 6 batidas (E, S, E, S, E, S) = 3 intervalos somados. Ímpar de batidas = Inconsistente.
 * @param {Array} registrosDoDia - Registros do dia (com data_hora, tipo ENTRADA/SAIDA, id, etc.)
 * @param {number} metaMin - Meta do dia em minutos (padrão 510 = 8h30)
 * @returns {{ batidas: Array<{id, data_hora, hora, tipo}>, tempoLiquidoMin: number|null, saldoMin: number|null, inconsistente: boolean }}
 */
export function calcularDiaPonto(registrosDoDia = [], metaMin = JORNADA_META_MIN) {
  const regs = [...(registrosDoDia || [])]
    .filter((r) => r?.status !== 'INVALIDADO')
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))

  const batidas = regs.map((r) => ({
    id: r.id,
    data_hora: r.data_hora,
    hora: fmtHoraLocalPonto(r.data_hora),
    tipo: r.tipo,
    observacao: r.observacao,
  }))

  const inconsistente = batidas.length % 2 !== 0

  if (inconsistente) {
    return {
      batidas,
      tempoLiquidoMin: null,
      saldoMin: null,
      inconsistente: true,
    }
  }

  // Soma cada par ENTRADA → SAÍDA em ordem cronológica (igual ao backend; suporta várias idas e voltas)
  let tempoLiquidoMin = 0
  let entradaPendente = null
  for (const b of batidas) {
    if (b.tipo === 'ENTRADA') {
      entradaPendente = b
      continue
    }
    if (b.tipo === 'SAIDA' && entradaPendente) {
      const entMin = hhmmParaMinutos(entradaPendente.hora)
      const saiMin = hhmmParaMinutos(b.hora)
      if (saiMin > entMin) tempoLiquidoMin += saiMin - entMin
      entradaPendente = null
    }
  }

  const saldoMin = tempoLiquidoMin - metaMin
  return {
    batidas,
    tempoLiquidoMin,
    saldoMin,
    inconsistente: false,
  }
}
