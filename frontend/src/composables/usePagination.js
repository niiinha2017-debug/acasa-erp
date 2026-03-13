import { ref, computed, watch } from 'vue'

/**
 * Paginação no cliente (slice da lista em memória).
 * Use em telas de listagem que carregam todos os registros e exibem em tabela.
 *
 * @param {import('vue').Ref<any[]>} itemsRef - Ref ou computed com a lista completa (ex.: filtrados)
 * @param {Object} options
 * @param {number} [options.pageSize=15] - Itens por página
 * @returns {Object} { page, setPage, total, totalPages, pageSize, rowsToShow } - Para Table + TablePagination
 */
export function usePagination(itemsRef, options = {}) {
  const pageSize = options.pageSize ?? 15
  const page = ref(1)

  const total = computed(() => {
    const list = itemsRef?.value ?? []
    return Array.isArray(list) ? list.length : 0
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize))
  )

  const rowsToShow = computed(() => {
    const list = itemsRef?.value ?? []
    if (!Array.isArray(list)) return []
    const start = (page.value - 1) * pageSize
    return list.slice(start, start + pageSize)
  })

  function setPage(p) {
    const n = Number(p)
    if (Number.isFinite(n) && n >= 1) {
      page.value = Math.min(n, totalPages.value)
    }
  }

  // Ao mudar a lista (ex.: filtro), voltar para a primeira página
  watch(total, () => {
    if (page.value > totalPages.value) {
      page.value = 1
    }
  })

  return {
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    rowsToShow,
  }
}
