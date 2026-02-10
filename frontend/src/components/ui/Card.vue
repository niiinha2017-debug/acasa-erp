<template>
  <div
    class="transition-all duration-300 ease-in-out font-sans"
    :class="[
      minimal ? 'rounded-md bg-bg-card border border-slate-200/60 dark:border-slate-700/60' : 'rounded-xl border border-slate-200/60 dark:border-slate-700/60',
      !minimal && [
        variant === 'default'
          ? 'bg-white dark:bg-slate-900'
          : 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-950/20',
        {
          'shadow-none': shadow && !hoverable,
          'hover:shadow-sm hover:shadow-slate-200/40 dark:hover:shadow-none cursor-pointer': hoverable,
          'ring-2 ring-brand-primary/10': active,
        },
      ],
      { 'overflow-hidden': true },
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  shadow: {
    type: Boolean,
    default: true,
  },
  hoverable: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
  },
  active: {
    type: Boolean,
    default: false,
  },
  minimal: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
/* Adiciona uma suavidade extra para o Dark Mode se necessário */
.dark div {
  --tw-shadow: 0 0 #0000;
}
</style>
