<template>
  <div 
    class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] border transition-all duration-300 select-none"
    :class="statusStyle"
  >
    <span class="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0" :class="dotStyle"></span>
    {{ label || value }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: [String, Number, Boolean],
  label: String
})

const statusStyle = computed(() => {
  const val = String(props.value).toLowerCase()
  
  // SUCESSO
  if (['ativo', 'pago', 'entregue', 'finalizado', 'concluido'].includes(val)) 
    return 'bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    
  // PERIGO / ERRO
  if (['inativo', 'atrasado', 'cancelado', 'erro'].includes(val)) 
    return 'bg-red-50/50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
    
  // AVISO / PENDENTE
  if (['pendente', 'aguardando', 'rascunho', 'em análise'].includes(val)) 
    return 'bg-amber-50/50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
    
  // PADRÃO / NEUTRO
  return 'bg-slate-50/50 text-slate-500 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
})

const dotStyle = computed(() => {
  const val = String(props.value).toLowerCase()
  if (['ativo', 'pago', 'finalizado'].includes(val)) return 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]'
  if (['inativo', 'atrasado', 'cancelado'].includes(val)) return 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
  if (['pendente', 'aguardando'].includes(val)) return 'bg-amber-500'
  return 'bg-slate-400'
})
</script>