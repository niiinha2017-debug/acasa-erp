<template>
  <div class="p-6 text-center">
    <p class="text-text-soft text-sm font-bold">Redirecionando para Fechamento de Folha...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePage({ meta: { perm: 'despesas.ver' } })

const router = useRouter()
onMounted(() => {
  router.replace('/rh/ponto/relatorio')
})
</script>
