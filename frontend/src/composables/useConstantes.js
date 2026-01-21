import { ref } from 'vue'
import {
  PIPELINE_PLANO_CORTE,
  UNIDADES,
  // (se quiser depois: STATUS_FINANCEIRO, FORMAS_PAGAMENTO, etc.)
} from '@/constantes'

const opcoes = ref([])

/**
 * Helper: adiciona opções sem duplicar (categoria + value)
 */
function upsertCategoria(categoria, options = []) {
  // remove opções antigas dessa categoria
  opcoes.value = opcoes.value.filter(o => o?.metadata?.categoria !== categoria)

  // adiciona novas
  const mapped = (options || []).map(o => ({
    label: o.label ?? String(o.value ?? ''),
    value: o.value ?? o.key ?? o.label,
    metadata: { categoria },
  }))

  opcoes.value.push(...mapped)
}

function montarCategoriaLocal(categoria) {
  // Mapa de categorias locais (mesmo nome que você estava pedindo na API)
  const MAP = {
    STATUS_PLANO_CORTE: (PIPELINE_PLANO_CORTE || []).map(s => ({
      label: s.label,
      value: s.key,
    })),

    // ✅ use isso para o select de unidade no modal produto
    UNIDADES: (UNIDADES || []).map(u => ({
      label: u.label ?? u,
      value: u.value ?? u.label ?? u,
    })),

    // Se você realmente precisa manter MODULO por compatibilidade:
    // MODULO: [{ label: 'UNIDADE', value: 'UNIDADE' }],
  }

  return MAP[categoria] || []
}

async function carregarCategoria(categoria) {
  const options = montarCategoriaLocal(categoria)
  upsertCategoria(categoria, options)
  return options
}

export function useConstantes() {
  return {
    opcoes,
    carregarCategoria,
  }
}
