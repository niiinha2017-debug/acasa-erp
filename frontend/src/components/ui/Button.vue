<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none rounded-md border focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': fullWidth, 'btn-primary-hero': variant === 'primary' }
    ]"
    @click="handleClick"
  >
    <svg v-if="loading" class="animate-spin h-5 w-5 absolute z-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <span :class="[{ 'opacity-0': loading }, 'relative z-10 flex items-center gap-2']">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'button' },
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary', 'outline', 'danger', 'success', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  label: String,
  loading: Boolean,
  disabled: Boolean,
  fullWidth: Boolean
})

const emit = defineEmits(['click'])

const variantClasses = {
  primary: `
    text-white border border-transparent
  `,
  secondary: `
    bg-bg-card text-slate-700 border border-border-ui
    hover:bg-slate-50 hover:border-slate-300
    dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600
  `,
  outline: `
    bg-transparent border border-brand-primary/70 text-brand-primary
    hover:bg-brand-primary/10 hover:border-brand-primary
    dark:border-brand-primary/70 dark:text-brand-primary/90 dark:hover:bg-brand-primary/10
  `,
  danger: `
    bg-red-500 text-white border border-red-500
    hover:bg-red-600 hover:border-red-600
  `,
  success: `
    bg-emerald-500 text-white border border-emerald-500
    hover:bg-emerald-600 hover:border-emerald-600
  `,
  ghost: `
    bg-transparent text-slate-600 border border-transparent
    hover:bg-slate-100
    dark:text-slate-400 dark:hover:bg-slate-800
  `
}

const sizeClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base'
}

const handleClick = (event) => {
  if (!props.loading && !props.disabled) emit('click', event)
}
</script>

<style scoped>
.btn-primary-hero {
  background: linear-gradient(
    135deg,
    var(--color-brand-dark),
    color-mix(in srgb, var(--color-brand-dark) 55%, var(--color-brand-primary)),
    var(--color-brand-primary)
  );
  box-shadow: 0 2px 8px rgba(2, 6, 23, 0.18);
}

.btn-primary-hero:hover {
  filter: brightness(1.05);
}

.btn-primary-hero:active {
  filter: brightness(0.98);
}
</style>
