<template>
  <div 
    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors duration-300"
    :class="statusStyle"
  >
    <span class="w-1.5 h-1.5 rounded-full mr-2 animate-pulse shadow-[0_0_8px_currentColor]" :class="dotStyle"></span>
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
  
  // SUCESSO / FINALIZADO
  if (['ativo', 'pago', 'entregue', 'finalizado'].includes(val)) 
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    
  // PERIGO / ALERTA
  if (['inativo', 'atrasado', 'cancelado'].includes(val)) 
    return 'bg-red-500/10 text-red-500 border-red-500/20'
    
  // AGUARDANDO / PENDENTE (Amarelo)
  if (['pendente', 'aguardando', 'rascunho'].includes(val)) 
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
})


const dotStyle = computed(() => {
  const val = String(props.value).toLowerCase()
  if (['ativo', 'pago', 'true', '1'].includes(val)) return 'bg-emerald-500'
  if (['inativo', 'atrasado', 'false', '0'].includes(val)) return 'bg-red-500'
  return 'bg-slate-400'
})
</script>