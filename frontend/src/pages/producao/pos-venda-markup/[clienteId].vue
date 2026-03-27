<script setup>
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePage({ meta: { perm: ['clientes.ver', 'arquivos.ver'] } })

const route = useRoute()
const router = useRouter()

onBeforeMount(() => {
  const id = String(route.params.clienteId || '').replace(/\D/g, '')
  router.replace(id ? `/comercial/pos-venda-markup/${id}` : '/comercial/pos-venda-markup')
})
</script>

<template>
  <div class="p-8 text-sm text-text-muted">Redirecionando…</div>
</template>
