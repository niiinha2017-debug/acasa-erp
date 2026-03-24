import { ref, computed } from 'vue'
import { EstrategiaPrecosService, ProdutosService } from '@/services'

export function useMateriais() {
  const materiais = ref([])
  const catalogoFerragens = ref([])
  // Preços finais processados pela Aba 5 da Estratégia de Preços
  // { PRIMARIA: 95.00, SECUNDARIA: 122.00, TERCIARIA: 160.00 }
  const precoFinalPorCategoria = ref({})

  const materialOptions = computed(() =>
    materiais.value.map((m) => ({
      value: m.id,
      label: `${m.nome_produto || m.group || 'MDF'}${(m.cor || m.color) ? ` - ${m.cor || m.color}` : ''}${m.marca ? ` (${m.marca})` : ''}`,
    })),
  )

  const ferragemOptions = computed(() =>
    catalogoFerragens.value.map((p) => ({
      value: p.id,
      label: `${p.nome_produto || 'Ferragem'}${p.marca ? ` (${p.marca})` : ''}`,
    })),
  )

  function normalizarTextoInterno(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  function normalizarMaterialMdf(item = {}, idx = 0) {
    const categoria = String(
      item.categoria_base || item.category || item.commercial_category || item.categoria || 'PRIMARIA',
    ).trim().toUpperCase()
    const cor = String(item.cor || item.color || item.group || '').trim()
    const nomeProduto = String(item.nome_produto || item.group || item.color || 'MDF').trim()
    const espessura = Number(item.espessura_mm ?? item.thickness ?? 0) || 0
    const idFallback = `MDF_${categoria}_${espessura}_${normalizarTextoInterno(cor || nomeProduto)}_${idx}`
    return {
      ...item,
      id: item.id ?? idFallback,
      categoria_base: categoria,
      nome_produto: nomeProduto,
      cor,
      espessura_mm: espessura,
      marca: item.marca ?? null,
    }
  }

  function getMaterialById(id) {
    return materiais.value.find((m) => m.id === id) ?? null
  }

  function getCustoM2DoProduto(material) {
    if (!material) return 0

    // 1ª prioridade: preço final processado pela Aba 5 da Estratégia de Preços
    // Normaliza a categoria para a chave usada no processamento (PRIMARIA/SECUNDARIA/TERCIARIA)
    const cat = String(
      material.categoria_base || material.category || material.commercial_category || 'PRIMARIA'
    ).trim().toUpperCase()

    const precoFinal = Number(precoFinalPorCategoria.value?.[cat] ?? 0)
    if (Number.isFinite(precoFinal) && precoFinal > 0) return precoFinal

    // Fallback: cost_base bruto do produto (quando matriz ainda não foi processada)
    const costBase = Number(material.cost_base ?? 0)
    return Number.isFinite(costBase) && costBase > 0 ? costBase : 0
  }

  function getCustoM2ByMaterial(materialId) {
    const mat = getMaterialById(materialId)
    return getCustoM2DoProduto(mat)
  }

  function getFerragemById(id) {
    return catalogoFerragens.value.find((p) => p.id === id) ?? null
  }

  function catStyle(catId) {
    if (catId === 'PRIMARIA')   return 'bg-bg-page text-text-main'
    if (catId === 'SECUNDARIA') return 'bg-blue-100 text-blue-700'
    if (catId === 'TERCIARIA')  return 'bg-purple-100 text-purple-700'
    return 'bg-bg-page text-text-main'
  }

  async function carregarCatalogosEstrategia(onMateriaisCarregados) {
    try {
      const { data: mats } = await EstrategiaPrecosService.listarMateriaisMdf()
      materiais.value = Array.isArray(mats) ? mats.map((item, idx) => normalizarMaterialMdf(item, idx)) : []
      if (onMateriaisCarregados) onMateriaisCarregados()
    } catch { /* lista vazia */ }

    try {
      const { data: fgs } = await ProdutosService.listarFerragens()
      catalogoFerragens.value = Array.isArray(fgs) ? fgs : (Array.isArray(fgs?.data) ? fgs.data : [])
    } catch { /* sem catálogo */ }

    // Carrega preços finais processados pela Aba 5 da Estratégia de Preços
    try {
      const { data: configs } = await EstrategiaPrecosService.listarConfiguracoesPreco()
      const map = {}
      for (const cfg of Array.isArray(configs) ? configs : []) {
        const cat = String(cfg?.categoria_comercial || '').trim().toUpperCase()
        const valor = Number(cfg?.final_avg_value ?? cfg?.final_min_value ?? 0)
        if (cat && Number.isFinite(valor) && valor > 0) map[cat] = valor
      }
      precoFinalPorCategoria.value = map
    } catch { /* sem configurações — usa cost_base como fallback */ }
  }

  return {
    materiais,
    catalogoFerragens,
    precoFinalPorCategoria,
    materialOptions,
    ferragemOptions,
    normalizarMaterialMdf,
    getMaterialById,
    getCustoM2DoProduto,
    getCustoM2ByMaterial,
    getFerragemById,
    catStyle,
    carregarCatalogosEstrategia,
  }
}
