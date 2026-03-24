<template>
  <MedicaoInicialPage />
</template>

<script setup>
import MedicaoInicialPage from '@/components/medicao/MedicaoInicialPage.vue'

definePage({ meta: { perm: 'agendamentos.vendas' } })
</script>
