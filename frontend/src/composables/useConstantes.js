import { ref } from 'vue'
import api from '@/services/api'

export function useConstantes() {
  const opcoes = ref([])
  const carregando = ref(false)

  const carregarCategoria = async (categoria) => {
    carregando.value = true
    try {
      const { data } = await api.get(`/constantes?categoria=${categoria}`)
      opcoes.value = data.map(item => ({
        label: item.rotulo,
        value: item.chave,
        // Direcionamento: Anexa a taxa ou valor extra se existir
        metadata: {
          taxa: item.valor_numero,
          info: item.valor_texto
        }
      }))
    } finally {
      carregando.value = false
    }
  }

  return { opcoes, carregando, carregarCategoria }
}