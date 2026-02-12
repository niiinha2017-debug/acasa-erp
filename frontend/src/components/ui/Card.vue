<template>
  <div
    class="transition-all duration-300 ease-in-out"
    :class="[
      'rounded-xl border border-border-ui',
      variant === 'default'
        ? 'bg-bg-card text-text-main'
        : 'bg-slate-900 text-white shadow-xl shadow-slate-950/20',
      {
        'shadow-sm shadow-slate-100/50 dark:shadow-none': shadow && !hoverable,
        'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer': hoverable,
        'ring-2 ring-brand-primary/10 border-brand-primary/30': active,
        'overflow-hidden': true,
      },
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
})
</script>
