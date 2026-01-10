import { ref } from 'vue'
import api from '@/services/api'

export function useConstantes() {
  const opcoes = ref([])
  const carregando = ref(false)

  const carregarCategoria = async (categoria) => {
    carregando.value = true
    try {
      const { data } = await api.get(`/constantes?categoria=${encodeURIComponent(categoria)}`)

      opcoes.value = Array.isArray(data)
        ? data.map(item => ({
            label: item.rotulo,         // o que aparece na UI
            value: item.chave,          // o que identifica (chave)
            metadata: {
              taxa: item.valor_numero,
              info: item.valor_texto
            }
          }))
        : []
    } catch (err) {
      console.error('Erro na API constantes:', err)
      opcoes.value = []
    } finally {
      carregando.value = false
    }
  }

  return { opcoes, carregando, carregarCategoria }
}
