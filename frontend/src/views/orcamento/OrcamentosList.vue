<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const orcamentos = ref([])

function novoOrcamento() {
  router.push('/orcamentos/novo')
}

onMounted(async () => {
  const { data } = await api.get('/orcamentos')
  orcamentos.value = data
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>Orçamentos</h1>

      <button class="btn-primary" @click="novoOrcamento">
        Novo Orçamento
      </button>
    </div>

    <ul v-if="orcamentos.length">
      <li v-for="o in orcamentos" :key="o.id">
        {{ o.cliente_nome }} — {{ o.data_orcamento }}
      </li>
    </ul>

    <p v-else class="hint">
      Nenhum orçamento listado ainda.
    </p>
  </div>
</template>
