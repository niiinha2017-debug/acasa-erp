import { ref } from 'vue'
import api from '@/services/api'

export function useConstantes() {
  const opcoes = ref([])
  const carregando = ref(false)

// No seu useConstantes.js
const carregarCategoria = async (categoria) => {
  carregando.value = true
  try {
    const { data } = await api.get(`/constantes?categoria=${categoria}`)
    opcoes.value = Array.isArray(data) ? data.map(item => ({
      label: item.rotulo,
      value: item.chave,
      metadata: { taxa: item.valor_numero, info: item.valor_texto }
    })) : []
  } catch (err) {
    console.error("Erro na API:", err)
    opcoes.value = [] // Garante que não fique undefined
  } finally {
    carregando.value = false
  }
}
  return { opcoes, carregando, carregarCategoria }
}