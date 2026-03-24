/**
 * Ponte Croqui 2D (Konva, coords mundo em px) → JSON extrudável (mm) → Three.js.
 * Origem (0,0) em mm: centro geométrico do desenho (bbox de paredes + pontos), estável ao pan/zoom.
 */

export const ESPESSURA_PAREDE_PADRAO_MM = 150

const TIPO_PARA_JSON = {
  TOMADA: 'tomada',
  AGUA: 'agua',
  GAS: 'gas',
  VIGA: 'viga',
}

/**
 * Converte um ponto do plano do desenho (px mundo Konva) para mm com origem no centro escolhido.
 * Eixo Y do canvas (para baixo) vira eixo matemático “para cima” no plano em mm (y_mm positivo = “norte” no 2D exportado).
 */
export function stageWorldPxToMm(px, py, originWorldPxX, originWorldPxY, scaleMmPerPx) {
  const s = Number(scaleMmPerPx) || 1
  return {
    x: (px - originWorldPxX) * s,
    y: -(py - originWorldPxY) * s,
  }
}

export function bboxCenterWorldPx(walls, points) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const w of walls || []) {
    if (!w) continue
    minX = Math.min(minX, w.x1, w.x2)
    minY = Math.min(minY, w.y1, w.y2)
    maxX = Math.max(maxX, w.x1, w.x2)
    maxY = Math.max(maxY, w.y1, w.y2)
  }
  for (const p of points || []) {
    if (!p || !Number.isFinite(p.x)) continue
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0 }
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/**
 * Monta o JSON no formato fixo solicitado (paredes + pontos em mm).
 * @param {object} opts
 * @param {{ scaleMmPerPx?: number, walls?: any[], points?: any[] }} opts.esquemaPlanta
 * @param {number} [opts.peDireitoMm]
 * @param {number} [opts.escala] fator adicional armazenado (1 = real 1:1 em mm)
 * @param {number} [opts.espessuraParedeMm]
 */
export function buildExtrudavelJson({ esquemaPlanta, peDireitoMm = 2600, escala = 1, espessuraParedeMm = ESPESSURA_PAREDE_PADRAO_MM }) {
  const ep = esquemaPlanta && typeof esquemaPlanta === 'object' ? esquemaPlanta : {}
  const walls = Array.isArray(ep.walls) ? ep.walls : []
  const points = Array.isArray(ep.points) ? ep.points : []
  const scaleMmPerPx = Number(ep.scaleMmPerPx) > 0 ? Number(ep.scaleMmPerPx) : 2

  const origin = bboxCenterWorldPx(walls, points)

  /** IDs numéricos 1..n (contrato JSON); Konva usa strings tipo w_123 */
  const wallKeyToId = new Map(walls.map((w, i) => [w.id, i + 1]))

  const paredes = walls.map((w, i) => {
    const id = i + 1
    const start = stageWorldPxToMm(w.x1, w.y1, origin.x, origin.y, scaleMmPerPx)
    const end = stageWorldPxToMm(w.x2, w.y2, origin.x, origin.y, scaleMmPerPx)
    const lenPx = Math.hypot(w.x2 - w.x1, w.y2 - w.y1)
    const lengthMmGeom = Math.round(lenPx * scaleMmPerPx)
    const lengthMm =
      w.lengthMm != null && Number.isFinite(Number(w.lengthMm)) && Number(w.lengthMm) > 0
        ? Math.round(Number(w.lengthMm))
        : lengthMmGeom
    let angleDeg = w.angleDeg
    if (angleDeg == null || !Number.isFinite(Number(angleDeg))) {
      angleDeg = (Math.atan2(w.y2 - w.y1, w.x2 - w.x1) * 180) / Math.PI
    } else {
      angleDeg = Number(angleDeg)
    }
    return {
      id,
      start: { x: Math.round(start.x), y: Math.round(start.y) },
      end: { x: Math.round(end.x), y: Math.round(end.y) },
      espessura: espessuraParedeMm,
      lengthMm,
      angleDeg,
    }
  })

  const pontos = []

  for (const p of points) {
    const tipoRaw = String(p.tipo || '').toUpperCase()
    const tipo = TIPO_PARA_JSON[tipoRaw] || String(p.tipo || 'ponto').toLowerCase()
    const rawRef = p.paredeId ?? p.parede_id
    let wallNum = null
    let wallObj = null
    if (rawRef != null && rawRef !== '') {
      const mapped = wallKeyToId.get(rawRef)
      if (mapped != null) {
        wallNum = mapped
        wallObj = walls[mapped - 1]
      } else {
        const n = Number(rawRef)
        if (Number.isFinite(n) && n >= 1 && n <= walls.length) {
          wallNum = n
          wallObj = walls[n - 1]
        }
      }
    }
    if (wallNum == null) {
      const nearestKey = findNearestWallKey(p, walls)
      wallNum = nearestKey != null ? wallKeyToId.get(nearestKey) : null
      wallObj = nearestKey != null ? walls.find((w) => w.id === nearestKey) : null
    }
    if (!Number.isFinite(wallNum) || wallNum < 1) continue
    let dist = Number(p.distanciaParedeEsquerdaMm ?? p.distanciaDaQuina)
    if (!Number.isFinite(dist) || dist < 0) {
      dist = wallObj ? distanciaDaQuinaAoLongoParedeMm(p.x, p.y, wallObj, scaleMmPerPx) : 0
    }
    const alt = Number(p.alturaChaoMm ?? p.alturaPiso ?? 0)
    pontos.push({
      tipo,
      paredeId: wallNum,
      distanciaDaQuina: Math.max(0, Math.round(dist)),
      alturaPiso: Math.max(0, Math.round(alt)),
    })
  }

  return {
    ambiente: {
      peDireito: Math.round(Number(peDireitoMm) > 0 ? Number(peDireitoMm) : 2600),
      escala: Number(escala) > 0 ? Number(escala) : 1,
    },
    paredes,
    pontos,
  }
}

function findNearestWallKey(p, walls) {
  if (!walls?.length || !Number.isFinite(p.x)) return null
  let best = null
  let bestD = Infinity
  for (const w of walls) {
    const d = distPointToSegSq(p.x, p.y, w.x1, w.y1, w.x2, w.y2)
    if (d < bestD) {
      bestD = d
      best = w.id
    }
  }
  return best
}

/** Distância em mm do vértice (x1,y1) até a projeção ortogonal de (px,py) na parede. */
export function distanciaDaQuinaAoLongoParedeMm(px, py, wall, scaleMmPerPx) {
  if (!wall) return 0
  const x1 = wall.x1
  const y1 = wall.y1
  const x2 = wall.x2
  const y2 = wall.y2
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-10) return 0
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const qx = x1 + t * dx
  const qy = y1 + t * dy
  const dPx = Math.sqrt((qx - x1) ** 2 + (qy - y1) ** 2)
  return Math.round(dPx * scaleMmPerPx)
}

function distPointToSegSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-10) {
    const ddx = px - x1
    const ddy = py - y1
    return ddx * ddx + ddy * ddy
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const qx = x1 + t * dx
  const qy = y1 + t * dy
  const ddx = px - qx
  const ddy = py - qy
  return ddx * ddx + ddy * ddy
}

/**
 * Extrai o primeiro croqui extrudável com paredes a partir da lista de medições (mais recente por atualizado_em).
 */
export function extrairExtrudavelMaisRecenteDasMedicoes(medicoes) {
  return extrairMelhorExtrudavelDasMedicoes(medicoes)
}

/**
 * Escolhe o croqui com mais paredes (ambiente mais completo); em empate, o mais recente.
 * Evita mostrar só um segmento quando existe outra medição com planta fechada.
 */
export function extrairMelhorExtrudavelDasMedicoes(medicoes) {
  if (!Array.isArray(medicoes) || !medicoes.length) return null

  let best = null
  let bestCount = -1
  let bestTime = -1

  const considerar = (ex, atualizadoEm) => {
    if (!ex?.paredes?.length) return
    const n = ex.paredes.length
    const t = new Date(atualizadoEm || 0).getTime()
    if (n > bestCount || (n === bestCount && t > bestTime)) {
      bestCount = n
      bestTime = t
      best = ex
    }
  }

  for (const m of medicoes) {
    const pb = m?.planta_baixa_json
    const ambientes = pb?.ambientes
    const atualizado = m?.atualizado_em || m?.atualizadoEm
    if (!Array.isArray(ambientes)) continue
    for (const amb of ambientes) {
      const ep = amb?.esquemaPlanta
      const rawEx = amb?.extrudavel
      if (ep?.walls?.length) {
        const pe =
          rawEx?.ambiente?.peDireito != null
            ? Number(rawEx.ambiente.peDireito)
            : 2600
        considerar(
          buildExtrudavelJson({
            esquemaPlanta: ep,
            peDireitoMm: Number.isFinite(pe) && pe > 0 ? pe : 2600,
            escala: Number(rawEx?.ambiente?.escala) > 0 ? Number(rawEx.ambiente.escala) : 1,
          }),
          atualizado,
        )
        continue
      }
      if (rawEx?.paredes?.length) {
        considerar(rawEx, atualizado)
      }
    }
  }

  return best
}
