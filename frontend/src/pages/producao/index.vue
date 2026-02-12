<template>
  <div class="p-6">
    <p class="text-sm text-text-soft">Redirecionando para Producao...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePage({ meta: { perm: 'producao.ver' } })

const router = useRouter()

onMounted(() => {
  router.replace('/plano-corte')
})
</script>

