<template>
  <div
    class="transition-all duration-500 ease-out"
    :class="[
      // ARREDONDAMENTO PADRÃO PREMIUM
      'rounded-[2rem] border',
      
      // LÓGICA DE CORES (VARIANTE)
      variant === 'default' 
        ? 'bg-[var(--bg-card)] border-[var(--border-ui)]' 
        : 'bg-slate-900 border-slate-800 text-white',
      
      { 
        // SOMBRA DINÂMICA
        'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none': shadow && !hoverable,
        
        // HOVER INTELIGENTE
        'hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer': hoverable,
        
        // REAÇÃO À SELEÇÃO (ANEL DE BRILHO)
        'ring-4 ring-brand-primary/10 border-brand-primary/30': active,

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
  // 'default' para branco/cinza, 'dark' para o estilo do relatório
  variant: {
    type: String,
    default: 'default'
  },
  // Para ativar o brilho de seleção automaticamente
  active: {
    type: Boolean,
    default: false
  }
})
</script>