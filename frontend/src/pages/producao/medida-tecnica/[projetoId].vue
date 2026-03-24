<template>
  <div class="medida-tecnica-redirect">
    <p>Abrindo Medida Técnica...</p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePage({ meta: { perm: ['agendamentos.vendas', 'agendamentos.producao'] } })

const route = useRoute()
const router = useRouter()
const projetoId = computed(() => Number(String(route.params?.projetoId || '').replace(/\D/g, '')) || null)

onMounted(() => {
  const id = projetoId.value
  if (!id) {
    router.replace('/producao/medida-tecnica')
    return
  }
  router.replace({
    path: `/medicao-fina/${id}`,
    query: {
      source: 'projeto',
      back: '/producao/medida-tecnica',
      backLabel: 'Voltar para medida técnica',
      pageTitle: 'Medida técnica',
    },
  })
})
</script>

<style scoped>
.medida-tecnica-redirect {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-soft, #64748b);
  font-size: 0.9rem;
}
</style>
