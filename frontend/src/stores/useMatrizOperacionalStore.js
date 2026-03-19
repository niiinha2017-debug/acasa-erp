import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useMatrizOperacionalStore = defineStore('matriz-operacional', () => {
  const categoriaAtiva = ref('essencial')
  const resultadosPorCategoria = ref({})

  const precoFinalPorCategoria = computed(() => resultadosPorCategoria.value)

  const resumoAtivo = computed(() =>
    resultadosPorCategoria.value[categoriaAtiva.value] || {
      materialCost: 0,
      fita: 0,
      unidade: 0,
      rh: 0,
      finalValue: 0,
    },
  )

  function atualizarConsolidacaoTempoReal(payload = {}) {
    const categorias = Array.isArray(payload.categorias) ? payload.categorias : []
    const materialByCategory = payload.materialByCategory || {}
    const fitaByCategory = payload.fitaByCategory || {}
    const combinedByCategory = payload.combinedByCategory || {}
    const unidade = Number(payload.unidade || 0)
    const rh = Number(payload.rh || 0)

    const next = {}
    for (const cat of categorias) {
      const id = String(cat?.id || '')
      if (!id) continue
      const material = materialByCategory[id] || {}
      const fitaCategoria = fitaByCategory[id] || {}
      const combinadoCategoria = combinedByCategory[id] || {}
      const materialCost = Number((material.cost_base ?? material.avg_cost_base) || 0)
      const fitaValor = Number(fitaCategoria.avg ?? 0)
      const baseCombinada = Number(combinadoCategoria.value ?? (materialCost + fitaValor))
      const finalValue = baseCombinada + unidade + rh

      next[id] = {
        materialCost,
        fita: fitaValor,
        unidade,
        rh,
        finalValue,
      }
    }

    resultadosPorCategoria.value = next

    const ativa = String(payload.categoriaAtiva || '')
    if (ativa) categoriaAtiva.value = ativa
  }

  return {
    categoriaAtiva,
    precoFinalPorCategoria,
    resumoAtivo,
    atualizarConsolidacaoTempoReal,
  }
})
