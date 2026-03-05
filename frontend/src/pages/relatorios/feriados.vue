<template>
  <div class="p-6 text-center">
    <p class="text-sm text-text-muted mb-2">Feriados agora ficam em RH.</p>
    <RouterLink to="/rh/ponto/horas-extras" class="text-brand-primary font-bold underline">Ir para Feriados (RH)</RouterLink>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePage({ meta: { perm: 'ponto_relatorio.ver' } })

const router = useRouter()

onMounted(() => {
  router.replace('/rh/ponto/horas-extras')
})
</script>
