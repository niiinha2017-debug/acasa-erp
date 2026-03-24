function expandPecas(pecas = []) {
  const expanded = []
  let seq = 1
  for (const peca of pecas) {
    const qtd = Math.max(0, Number(peca?.quantidade || 0))
    const largura = Math.max(0, Number(peca?.largura_mm || 0))
    const altura = Math.max(0, Number(peca?.altura_mm || 0))
    if (!qtd || !largura || !altura) continue
    for (let i = 0; i < qtd; i += 1) {
      expanded.push({
        uid: `${peca.id || 'P'}-${seq}`,
        nome: peca.nome || `Peca ${seq}`,
        largura_mm: largura,
        altura_mm: altura,
      })
      seq += 1
    }
  }
  return expanded.sort((a, b) => (b.largura_mm * b.altura_mm) - (a.largura_mm * a.altura_mm))
}

function createChapas({ largura_mm, altura_mm, quantidade }) {
  const chapas = []
  const qtd = Math.max(1, Number(quantidade || 1))
  const largura = Number(largura_mm || 0)
  const altura = Number(altura_mm || 0)
  for (let i = 1; i <= qtd; i += 1) {
    chapas.push({
      id: i,
      largura_mm: largura,
      altura_mm: altura,
      colocacoes: [],
      livres: [{ x: 0, y: 0, w: largura, h: altura }],
    })
  }
  return chapas
}

function tryPlaceInLivre(peca, livre, kerf, permitirRotacao) {
  const candidatos = [
    { rotacionada: false, w: peca.largura_mm, h: peca.altura_mm },
  ]
  if (permitirRotacao && peca.largura_mm !== peca.altura_mm) {
    candidatos.push({ rotacionada: true, w: peca.altura_mm, h: peca.largura_mm })
  }

  let best = null
  for (const cand of candidatos) {
    if (cand.w <= livre.w && cand.h <= livre.h) {
      const sobraArea = (livre.w * livre.h) - (cand.w * cand.h)
      if (!best || sobraArea < best.sobraArea) {
        best = { ...cand, sobraArea }
      }
    }
  }
  if (!best) return null

  return {
    ...best,
    x: livre.x,
    y: livre.y,
  }
}

function splitLivreGuillotine(livre, placed, kerf) {
  const usados = []
  const rightW = livre.w - placed.w - kerf
  const bottomH = livre.h - placed.h - kerf

  if (rightW > 0) {
    usados.push({
      x: livre.x + placed.w + kerf,
      y: livre.y,
      w: rightW,
      h: placed.h,
    })
  }
  if (bottomH > 0) {
    usados.push({
      x: livre.x,
      y: livre.y + placed.h + kerf,
      w: livre.w,
      h: bottomH,
    })
  }
  return usados
}

function selectBestPlacement(chapas, peca, kerf, permitirRotacao) {
  let best = null
  chapas.forEach((chapa, chapaIdx) => {
    chapa.livres.forEach((livre, livreIdx) => {
      const placed = tryPlaceInLivre(peca, livre, kerf, permitirRotacao)
      if (!placed) return
      const score = placed.sobraArea
      if (!best || score < best.score) {
        best = { score, chapaIdx, livreIdx, placed }
      }
    })
  })
  return best
}

export function otimizarPlanoCorte({
  chapa_largura_mm,
  chapa_altura_mm,
  chapa_quantidade,
  pecas = [],
  kerf_mm = 3,
  permitir_rotacao = true,
  sobra_min_largura_mm = 80,
  sobra_min_altura_mm = 80,
} = {}) {
  const chapas = createChapas({
    largura_mm: chapa_largura_mm,
    altura_mm: chapa_altura_mm,
    quantidade: chapa_quantidade,
  })
  const queue = expandPecas(pecas)
  const naoAlocadas = []

  for (const peca of queue) {
    const best = selectBestPlacement(chapas, peca, kerf_mm, permitir_rotacao)
    if (!best) {
      naoAlocadas.push(peca)
      continue
    }
    const chapa = chapas[best.chapaIdx]
    const livre = chapa.livres[best.livreIdx]
    const placed = best.placed

    chapa.colocacoes.push({
      uid: peca.uid,
      nome: peca.nome,
      largura_mm: placed.w,
      altura_mm: placed.h,
      x: placed.x,
      y: placed.y,
      rotacionada: placed.rotacionada,
      area_mm2: placed.w * placed.h,
    })

    const novosLivres = splitLivreGuillotine(livre, placed, kerf_mm)
    chapa.livres.splice(best.livreIdx, 1, ...novosLivres)
  }

  const sobras = []
  chapas.forEach((chapa) => {
    chapa.livres.forEach((livre) => {
      if (livre.w >= sobra_min_largura_mm && livre.h >= sobra_min_altura_mm) {
        sobras.push({
          chapa_id: chapa.id,
          x: livre.x,
          y: livre.y,
          largura_mm: livre.w,
          altura_mm: livre.h,
          area_m2: Number(((livre.w * livre.h) / 1000000).toFixed(4)),
        })
      }
    })
  })

  const totalAreaPecas = queue.reduce((acc, p) => acc + (p.largura_mm * p.altura_mm), 0)
  const areaTotalChapas = chapas.reduce((acc, c) => acc + (c.largura_mm * c.altura_mm), 0)
  const areaAlocada = chapas.flatMap((c) => c.colocacoes).reduce((acc, c) => acc + c.area_mm2, 0)
  const aproveitamento = areaTotalChapas ? (areaAlocada / areaTotalChapas) * 100 : 0

  return {
    chapas: chapas.map((c) => ({
      id: c.id,
      largura_mm: c.largura_mm,
      altura_mm: c.altura_mm,
      colocacoes: c.colocacoes,
    })),
    lista_corte: chapas.flatMap((c) =>
      c.colocacoes.map((col, index) => ({
        chapa_id: c.id,
        ordem: index + 1,
        ...col,
      })),
    ),
    sobras,
    nao_alocadas: naoAlocadas,
    resumo: {
      pecas_total: queue.length,
      pecas_alocadas: queue.length - naoAlocadas.length,
      pecas_nao_alocadas: naoAlocadas.length,
      area_pecas_m2: Number((totalAreaPecas / 1000000).toFixed(4)),
      area_chapas_m2: Number((areaTotalChapas / 1000000).toFixed(4)),
      area_alocada_m2: Number((areaAlocada / 1000000).toFixed(4)),
      aproveitamento_pct: Number(aproveitamento.toFixed(2)),
    },
  }
}
