<template>
  <AgendaLojaPage />
</template>

<script setup>
import AgendaLojaPage from './index.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })
</script>
