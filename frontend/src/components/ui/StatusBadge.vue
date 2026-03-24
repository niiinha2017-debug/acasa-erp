<template>
  <div
    class="ds-status-pill select-none"
    :class="statusStyle"
  >
    <span class="ds-status-dot" :class="dotStyle"></span>
    {{ label || value }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: [String, Number, Boolean],
  label: String,
})

const statusStyle = computed(() => {
  const val = String(props.value ?? '').toLowerCase()

  if (['ativo', 'pago', 'entregue', 'finalizado', 'concluido', 'vigente'].includes(val)) {
    return 'ds-status-pill--success'
  }

  if (['inativo', 'atrasado', 'vencido', 'cancelado', 'erro'].includes(val)) {
    return 'ds-status-pill--danger'
  }

  if (['pendente', 'aguardando', 'rascunho', 'em analise', 'em análise'].includes(val)) {
    return 'ds-status-pill--warning'
  }

  if (['encerrado'].includes(val)) {
    return 'ds-status-pill--neutral'
  }

  return 'ds-status-pill--neutral'
})

const dotStyle = computed(() => {
  const val = String(props.value ?? '').toLowerCase()
  if (['ativo', 'pago', 'finalizado', 'entregue', 'concluido', 'vigente'].includes(val)) return 'bg-[color:var(--ds-color-success)]'
  if (['inativo', 'atrasado', 'vencido', 'cancelado', 'erro'].includes(val)) return 'bg-[color:var(--ds-color-danger)]'
  if (['pendente', 'aguardando', 'rascunho'].includes(val)) return 'bg-[color:var(--ds-color-warning)]'
  return 'bg-slate-400'
})
</script>
