<template>
  <AgendaFabricaPage />
</template>

<script setup>
import AgendaFabricaPage from './agenda-fabrica.vue'

definePage({ meta: { perm: 'agendamentos.producao' } })
</script>
