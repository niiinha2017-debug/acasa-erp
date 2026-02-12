<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="btn-core relative inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-xl outline-none border"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': fullWidth }
    ]"
    @click="handleClick"
  >
    <svg v-if="loading" class="animate-spin h-5 w-5 absolute z-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <span 
      :class="[
        { 'opacity-0': loading },
        'relative z-10 flex items-center gap-2'
      ]" 
    >
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
    btn-primary-hero text-white border-transparent
  `,
  secondary: `
    bg-bg-card text-text-main border-border-ui
    hover:border-slate-400 hover:bg-slate-50/80
    dark:hover:bg-slate-800/60 dark:hover:border-slate-600
  `,
  outline: `
    bg-transparent border-brand-primary/60 text-brand-primary
    hover:bg-brand-primary/10 hover:border-brand-primary
  `,
  danger: `
    bg-rose-500 text-white border-rose-500
    hover:bg-rose-600 hover:border-rose-600
  `,
  success: `
    bg-emerald-500 text-white border-emerald-500
    hover:bg-emerald-600 hover:border-emerald-600
  `,
  ghost: `
    bg-transparent text-text-soft border-transparent
    hover:bg-slate-100 hover:text-slate-800
    dark:hover:bg-slate-800 dark:hover:text-slate-200
  `
}

const sizeClasses = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-10 px-4 text-xs',
  lg: 'h-12 px-6 text-sm'
}

const handleClick = (event) => {
  if (!props.loading && !props.disabled) emit('click', event)
}
</script>

<style scoped>
.btn-core {
  letter-spacing: 0.04em;
}

.btn-primary-hero {
  background-image: linear-gradient(135deg, #2f7fb3 0%, #2d6f9d 45%, #255a82 100%);
  box-shadow: 0 8px 16px -12px rgba(37, 90, 130, 0.55);
}

.btn-primary-hero:hover {
  filter: brightness(1.04);
  box-shadow: 0 10px 18px -12px rgba(37, 90, 130, 0.6);
}
</style>
