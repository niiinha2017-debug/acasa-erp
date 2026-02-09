<template>
  <div
    class="transition-all duration-300 ease-in-out font-sans"
    :class="[
      'rounded-xl border',
      
      variant === 'default' 
        ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' 
        : 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-950/20',
      
      { 
        'shadow-sm shadow-slate-100/50 dark:shadow-none': shadow && !hoverable,
        'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer': hoverable,
        'ring-2 ring-brand-primary/10 border-brand-primary/30': active,
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