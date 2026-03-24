import { ref, reactive, computed } from 'vue'

export function useAmbientes({ encontrarMaterialPromob } = {}) {
  let _uid = 0
  function uid() { return ++_uid }

  // ── Fábricas ─────────────────────────────────────────────────
  function novoModulo() {
    return {
      _id: uid(),
      nome: '',
      largura_mm: 0,
      altura_mm: 0,
      material_id: null,
      ferragens: [],
      _ferragens_abertas: false,
      _ferragemBuscaId: null,
    }
  }

  function novaParede() {
    return {
      _id: uid(),
      nome: '',
      largura_mm: 0,
      altura_mm: 0,
      modulos: [novoModulo()],
      ferragens: [],
      _ferragemBuscaId: null,
      _ferragens_parede_abertas: true,
    }
  }

  function novoAmbiente() {
    return { _id: uid(), nome: '', paredes: [novaParede()] }
  }

  // ── Estado ────────────────────────────────────────────────────
  const ambientesVendedor = ref([])
  // modulosTecnico: chave = `${amb.id}_${parede.id}` → array de módulos
  const modulosTecnico = reactive({})
  const ambientesTecnicoOcultos = ref({})
  const ambientesEditaveisOcultos = ref({})

  // ── Helpers de chave ─────────────────────────────────────────
  function chaveT(ambId, paredeId) { return `${ambId}_${paredeId}` }

  function keyAmbienteEditavel(ambiente, idx) {
    return String(ambiente?._id ?? idx)
  }

  // ── Visibilidade ──────────────────────────────────────────────
  function ambienteOcultoTecnico(ambienteId) {
    return Boolean(ambientesTecnicoOcultos.value[String(ambienteId)])
  }
  function toggleAmbienteTecnico(ambienteId) {
    const key = String(ambienteId)
    ambientesTecnicoOcultos.value[key] = !ambienteOcultoTecnico(ambienteId)
  }
  function ambienteOcultoEditavel(ambiente, idx) {
    return Boolean(ambientesEditaveisOcultos.value[keyAmbienteEditavel(ambiente, idx)])
  }
  function toggleAmbienteEditavel(ambiente, idx) {
    const key = keyAmbienteEditavel(ambiente, idx)
    ambientesEditaveisOcultos.value[key] = !ambienteOcultoEditavel(ambiente, idx)
  }

  // ── CRUD vendedor ─────────────────────────────────────────────
  function getRef(ambientesPromob, origemMedida, ORIGEM_MEDIDA) {
    return origemMedida === ORIGEM_MEDIDA.PROMOB ? ambientesPromob : ambientesVendedor
  }

  function addAmbiente(ambientesEditaveis) { ambientesEditaveis.value.push(novoAmbiente()) }
  function removerAmbiente(ambientesEditaveis, idx) { ambientesEditaveis.value.splice(idx, 1) }
  function addParede(ambientesEditaveis, ambIdx) { ambientesEditaveis.value[ambIdx].paredes.push(novaParede()) }
  function removerParede(ambientesEditaveis, ambIdx, pIdx) { ambientesEditaveis.value[ambIdx].paredes.splice(pIdx, 1) }
  function addModuloVendedor(ambientesEditaveis, ambIdx, pIdx) { ambientesEditaveis.value[ambIdx].paredes[pIdx].modulos.push(novoModulo()) }
  function removerModuloVendedor(ambientesEditaveis, ambIdx, pIdx, mIdx) { ambientesEditaveis.value[ambIdx].paredes[pIdx].modulos.splice(mIdx, 1) }

  // ── CRUD técnico ──────────────────────────────────────────────
  function addModuloTecnico(ambId, paredeId) {
    const k = chaveT(ambId, paredeId)
    if (!modulosTecnico[k]) modulosTecnico[k] = []
    modulosTecnico[k].push(novoModulo())
  }
  function removerModuloTecnico(ambId, paredeId, mIdx) {
    const k = chaveT(ambId, paredeId)
    modulosTecnico[k]?.splice(mIdx, 1)
  }

  // ── Hidratação a partir do orçamento salvo ────────────────────
  function parseObservacaoItem(item) {
    const bruto = String(item?.observacao || '').trim()
    if (!bruto) return {}
    try {
      const parsed = JSON.parse(bruto)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  function moduloFromItemSalvo(item, idx = 0) {
    const extra = parseObservacaoItem(item)
    const quantidade = Math.max(1, Number(extra?.quantidade || 1))
    const areaM2 = Math.max(0, Number(extra?.area_m2 || 0))
    const areaUnitM2 = quantidade > 0 ? areaM2 / quantidade : areaM2
    const alturaBaseMm = 1000
    const larguraInferidaMm = areaUnitM2 > 0
      ? Math.max(100, Math.round((areaUnitM2 * 1_000_000) / alturaBaseMm))
      : 1000
    const materialNome = String(extra?.material || '').trim()
    const materialEncontrado = (materialNome && encontrarMaterialPromob)
      ? encontrarMaterialPromob(materialNome)
      : null

    return {
      _id: uid(),
      nome: String(item?.descricao || `Módulo ${idx + 1}`).trim() || `Módulo ${idx + 1}`,
      largura_mm: larguraInferidaMm,
      altura_mm: areaUnitM2 > 0 ? alturaBaseMm : 0,
      material_id: materialEncontrado?.id ?? null,
      material_nao_encontrado: Boolean(materialNome) && !materialEncontrado,
      material_nome_original: materialNome,
      ferragens: [],
      _ferragens_abertas: false,
      _ferragemBuscaId: null,
    }
  }

  function hidratarAmbientesSalvos(orcamentoAtual) {
    const itens = Array.isArray(orcamentoAtual?.itens) ? orcamentoAtual.itens : []
    if (!itens.length) return []

    const medidasPorAmbiente = new Map()
    const ambientesMedidos = orcamentoAtual?.agenda_loja?.medicao_orcamento?.ambientes ?? []
    ambientesMedidos.forEach((amb) => {
      const nome = String(amb?.nome_ambiente || '').trim().toUpperCase()
      if (!nome) return
      let medidasJson = {}
      try { medidasJson = amb?.medidas_json ? JSON.parse(amb.medidas_json) : {} } catch { medidasJson = {} }
      medidasPorAmbiente.set(nome, {
        vendedor: medidasJson?.medida_vendedor || {},
        tecnico: medidasJson?.medida_tecnica || {},
        largura_m: Number(amb?.largura_m || 0),
        altura_m: Number(amb?.pe_direito_m || 0),
      })
    })

    const agrupado = new Map()
    itens.forEach((item) => {
      const nome = String(item?.nome_ambiente || 'Ambiente').trim() || 'Ambiente'
      if (!agrupado.has(nome)) agrupado.set(nome, [])
      agrupado.get(nome).push(item)
    })

    return Array.from(agrupado.entries()).map(([nomeAmbiente, itensAmbiente]) => {
      const medidas = medidasPorAmbiente.get(String(nomeAmbiente).trim().toUpperCase()) || {}
      const parede = novaParede()
      parede.nome = 'Parede principal'
      parede.modulos = itensAmbiente.map((item, idx) => moduloFromItemSalvo(item, idx))
      parede.largura_mm = parede.modulos.reduce((acc, mod) => acc + Number(mod?.largura_mm || 0), 0)
      parede.altura_mm = Math.max(
        Number(medidas?.vendedor?.altura_m || 0) * 1000,
        Number(medidas?.tecnico?.altura_m || 0) * 1000,
        ...parede.modulos.map((mod) => Number(mod?.altura_mm || 0)),
        0,
      )

      const larguraMedidaMm = Math.max(
        Number(medidas?.vendedor?.largura_m || 0) * 1000,
        Number(medidas?.tecnico?.largura_m || 0) * 1000,
        Number(medidas?.largura_m || 0) * 1000,
        0,
      )
      if (larguraMedidaMm > 0) parede.largura_mm = Math.max(parede.largura_mm, larguraMedidaMm)

      return { _id: uid(), nome: nomeAmbiente, paredes: [parede] }
    })
  }

  // ── Ocupação ──────────────────────────────────────────────────
  function ocupacaoTecnico(ambId, paredeId, largura_mm_parede) {
    const soma = (modulosTecnico[chaveT(ambId, paredeId)] || []).reduce((a, m) => a + Number(m.largura_mm || 0), 0)
    return { soma, excede: soma > largura_mm_parede }
  }

  function ocupacaoVendedor(parede) {
    const soma = parede.modulos.reduce((a, m) => a + Number(m.largura_mm || 0), 0)
    return { soma, excede: parede.largura_mm > 0 && soma > parede.largura_mm }
  }

  return {
    ambientesVendedor,
    modulosTecnico,
    chaveT,
    novoModulo,
    novaParede,
    novoAmbiente,
    uid,
    getRef,
    addAmbiente,
    removerAmbiente,
    addParede,
    removerParede,
    addModuloVendedor,
    removerModuloVendedor,
    addModuloTecnico,
    removerModuloTecnico,
    hidratarAmbientesSalvos,
    moduloFromItemSalvo,
    ambienteOcultoTecnico,
    toggleAmbienteTecnico,
    ambienteOcultoEditavel,
    toggleAmbienteEditavel,
    ocupacaoTecnico,
    ocupacaoVendedor,
  }
}
