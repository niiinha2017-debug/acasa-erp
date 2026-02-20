<template>
  <div class="w-full h-full flex items-center justify-center min-h-[200px]">
    <div v-if="!redirecionado" class="text-center text-text-soft">
      <i class="pi pi-spin pi-spinner text-2xl mb-2" />
      <p>Abrindo edição da venda...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePage({ meta: { perm: 'vendas.editar' } })

const route = useRoute()
const router = useRouter()
const redirecionado = ref(false)

onMounted(() => {
  const id = route.params?.id
  if (!id) {
    router.replace('/vendas/fechamento')
    return
  }
  redirecionado.value = true
  router.replace({ path: `/vendas/${id}`, query: { contexto: 'venda' } })
})
</script>
