<template>
  <div
    class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border transition-all duration-300 select-none"
    :class="statusStyle"
  >
    <span class="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" :class="dotStyle"></span>
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

  if (['ativo', 'pago', 'entregue', 'finalizado', 'concluido'].includes(val)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
  }

  if (['inativo', 'atrasado', 'cancelado', 'erro'].includes(val)) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
  }

  if (['pendente', 'aguardando', 'rascunho', 'em analise', 'em análise'].includes(val)) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
  }

  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30'
})

const dotStyle = computed(() => {
  const val = String(props.value ?? '').toLowerCase()
  if (['ativo', 'pago', 'finalizado', 'entregue', 'concluido'].includes(val)) return 'bg-emerald-500'
  if (['inativo', 'atrasado', 'cancelado', 'erro'].includes(val)) return 'bg-rose-500'
  if (['pendente', 'aguardando'].includes(val)) return 'bg-amber-500'
  return 'bg-slate-400'
})
</script>
