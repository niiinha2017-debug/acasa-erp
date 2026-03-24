import { ref, reactive, computed } from 'vue'

/**
 * @param {Object} deps
 * @param {Function} deps.getCustoM2ByMaterial    - (materialId) → number
 * @param {Function} deps.custoFerragensModulo     - (mod) → number
 * @param {Function} deps.custoFerragensLista      - (lista) → number
 * @param {Function} deps.quantidadeFerragensModulo - (mod) → number
 * @param {Function} deps.quantidadeFerragensLista  - (lista) → number
 * @param {Object}   deps.modulosTecnico            - reactive { [chave]: mod[] }
 * @param {Function} deps.chaveT                   - (ambId, paredeId) → string
 * @param {import('vue').Ref} deps.ambientesEditaveis
 * @param {import('vue').Ref} deps.ambientesTecnico
 * @param {import('vue').Ref} deps.origemMedida
 * @param {Object}   deps.ORIGEM_MEDIDA
 */
export function useCustos({
  getCustoM2ByMaterial,
  custoFerragensModulo,
  custoFerragensLista,
  quantidadeFerragensModulo,
  quantidadeFerragensLista,
  modulosTecnico,
  chaveT,
  ambientesEditaveis,
  ambientesTecnico,
  origemMedida,
  ORIGEM_MEDIDA,
}) {
  const margemLucroPct = ref(30)
  const custosFixos = reactive({
    cola: 0,
    parafusos: 0,
    frete: 0,
    montagem: 0,
    marcenaria: 0,
  })

  // ── Área ──────────────────────────────────────────────────────
  function areaModuloM2(mod) {
    return (Number(mod.largura_mm || 0) * Number(mod.altura_mm || 0)) / 1_000_000
  }

  function areaTecnicoAmbiente(amb) {
    const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
    if (paredes.length) return paredes.reduce((a, p) => a + Number(p.largura_m || 0) * Number(p.pe_direito_m || 0), 0)
    return Number(amb.largura_m || 0) * Number(amb.pe_direito_m || 0)
  }

  function areaVendedorAmbiente(amb) {
    return (amb.paredes || []).reduce((a, p) => a + (Number(p.largura_mm) * Number(p.altura_mm)) / 1_000_000, 0)
  }

  // ── Custo módulo ──────────────────────────────────────────────
  function custoMdfModulo(mod) {
    return areaModuloM2(mod) * getCustoM2ByMaterial(mod.material_id)
  }

  function custoModulo(mod) {
    return custoMdfModulo(mod) + custoFerragensModulo(mod)
  }

  // ── Custo parede ──────────────────────────────────────────────
  function custoParede(parede) {
    const custoModulos = (parede.modulos || []).reduce((a, m) => a + custoModulo(m), 0)
    return custoModulos + custoFerragensLista(parede.ferragens || [])
  }

  function custoVendedorAmbiente(amb) {
    return (amb.paredes || []).reduce((a, p) => a + custoParede(p), 0)
  }

  // ── Custo técnico por parede/ambiente ─────────────────────────
  function custoModulosTecnicoParede(ambId, paredeId) {
    return (modulosTecnico[chaveT(ambId, paredeId)] || []).reduce((a, m) => a + custoModulo(m), 0)
  }

  function custoTecnicoAmbiente(amb) {
    const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
    return paredes.reduce((a, p) => a + custoModulosTecnicoParede(amb.id, p.id), 0)
  }

  // ── Resumo por ambiente ───────────────────────────────────────
  function resumoTecnicoAmbiente(amb) {
    const paredes = Array.isArray(amb.paredes) ? amb.paredes : []
    let mdfM2 = 0, custoMdf = 0, ferragensUn = 0, custoFerragens = 0
    paredes.forEach((parede) => {
      const mods = modulosTecnico[chaveT(amb.id, parede.id)] || []
      mods.forEach((mod) => {
        mdfM2 += areaModuloM2(mod)
        custoMdf += custoMdfModulo(mod)
        ferragensUn += quantidadeFerragensModulo(mod)
        custoFerragens += custoFerragensModulo(mod)
      })
    })
    return {
      id: `T_${amb.id}`,
      nome: amb.nome_ambiente || `Ambiente #${amb.id}`,
      area: areaTecnicoAmbiente(amb),
      mdfM2,
      ferragensUn,
      custoMdf,
      custoFerragens,
    }
  }

  function resumoVendedorAmbiente(amb, idx) {
    let mdfM2 = 0, custoMdf = 0, ferragensUn = 0, custoFerragens = 0
    ;(amb.paredes || []).forEach((parede) => {
      ;(parede.modulos || []).forEach((mod) => {
        mdfM2 += areaModuloM2(mod)
        custoMdf += custoMdfModulo(mod)
        ferragensUn += quantidadeFerragensModulo(mod)
        custoFerragens += custoFerragensModulo(mod)
      })
      ferragensUn += quantidadeFerragensLista(parede.ferragens || [])
      custoFerragens += custoFerragensLista(parede.ferragens || [])
    })
    return {
      id: `V_${amb._id || idx}`,
      nome: amb.nome || `Ambiente ${idx + 1}`,
      area: areaVendedorAmbiente(amb),
      mdfM2,
      ferragensUn,
      custoMdf,
      custoFerragens,
    }
  }

  // ── Totais ────────────────────────────────────────────────────
  const totalAreaM2 = computed(() => {
    if (origemMedida.value === ORIGEM_MEDIDA.TECNICO)
      return ambientesTecnico.value.reduce((a, amb) => a + areaTecnicoAmbiente(amb), 0)
    return ambientesEditaveis.value.reduce((a, amb) => a + areaVendedorAmbiente(amb), 0)
  })

  const totalInsumosFixos = computed(() =>
    Number(custosFixos.cola || 0) + Number(custosFixos.parafusos || 0),
  )
  const totalCustosOperacionais = computed(() =>
    Number(custosFixos.frete || 0) + Number(custosFixos.montagem || 0) + Number(custosFixos.marcenaria || 0),
  )
  const totalCustosFixos = computed(() => totalInsumosFixos.value + totalCustosOperacionais.value)

  const resumoAmbientes = computed(() => {
    const baseRows = origemMedida.value === ORIGEM_MEDIDA.TECNICO
      ? ambientesTecnico.value.map((amb) => resumoTecnicoAmbiente(amb))
      : ambientesEditaveis.value.map((amb, idx) => resumoVendedorAmbiente(amb, idx))

    const areaTotal = Number(totalAreaM2.value || 0)
    return baseRows.map((row) => {
      const custoBase = row.custoMdf + row.custoFerragens
      const rateio = areaTotal > 0 ? totalCustosFixos.value * (row.area / areaTotal) : 0
      const custoComRateio = custoBase + rateio
      const lucroReal = custoComRateio * (Number(margemLucroPct.value || 0) / 100)
      const valorVenda = custoComRateio + lucroReal
      return { ...row, custoBase, rateio, lucroReal, valorVenda }
    })
  })

  const totalCustoBase = computed(() => resumoAmbientes.value.reduce((a, r) => a + r.custoBase, 0))
  const totalCusto = computed(() => totalCustoBase.value + totalCustosFixos.value)
  const lucroRealTotal = computed(() => resumoAmbientes.value.reduce((a, r) => a + r.lucroReal, 0))
  const precoVenda = computed(() => resumoAmbientes.value.reduce((a, r) => a + r.valorVenda, 0))

  function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
  }

  return {
    margemLucroPct,
    custosFixos,
    areaModuloM2,
    areaTecnicoAmbiente,
    areaVendedorAmbiente,
    custoMdfModulo,
    custoModulo,
    custoParede,
    custoVendedorAmbiente,
    custoModulosTecnicoParede,
    custoTecnicoAmbiente,
    resumoTecnicoAmbiente,
    resumoVendedorAmbiente,
    resumoAmbientes,
    totalAreaM2,
    totalInsumosFixos,
    totalCustosOperacionais,
    totalCustosFixos,
    totalCustoBase,
    totalCusto,
    lucroRealTotal,
    precoVenda,
    formatCurrency,
  }
}
