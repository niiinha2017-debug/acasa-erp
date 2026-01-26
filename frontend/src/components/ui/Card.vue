<template>
  <div
    class="transition-all duration-300 ease-in-out"
    :class="[
      // ARREDONDAMENTO SOFISTICADO (16px a 24px é o ideal para Desktop Premium)
      'rounded-2xl border',
      
      // LÓGICA DE CORES REFINADA
      variant === 'default' 
        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' 
        : 'bg-slate-900 border-slate-800 text-white shadow-2xl shadow-slate-950/20',
      
      { 
        // SOMBRA CLEAN (Sutil, baseada em elevação real)
        'shadow-sm shadow-slate-200/50 dark:shadow-none': shadow && !hoverable,
        
        // HOVER DE ALTO PADRÃO (Sem exagerar no movimento)
        'hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-none hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer': hoverable,
        
        // REAÇÃO À SELEÇÃO (Substituímos o ring grosso por uma borda interna elegante)
        'border-brand-primary/50 ring-1 ring-brand-primary/20': active,

        'overflow-hidden': true
      }
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  shadow: { 
    type: Boolean, 
    default: true 
  },
  hoverable: { 
    type: Boolean, 
    default: false 
  },
  variant: {
    type: String,
    default: 'default' // 'default' ou 'dark'
  },
  active: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
/* Adiciona uma suavidade extra para o Dark Mode se necessário */
.dark div {
  --tw-shadow: 0 0 #0000;
}
</style>