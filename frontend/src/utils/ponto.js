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
