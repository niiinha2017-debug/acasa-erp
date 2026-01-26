<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="relative inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-lg shrink-0"
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

    <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200"></div>
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
  // Primário: Azul Profundo, Sólido, com sombra suave
  primary: `
    bg-brand-primary text-white 
    shadow-sm shadow-brand-primary/20 
    hover:bg-[#3a78a8] hover:shadow-md hover:shadow-brand-primary/30
  `,
  // Secundário: Slate (Cinza azulado) - Muito elegante no Dark e Light
  secondary: `
    bg-slate-100 text-slate-900 
    dark:bg-slate-800 dark:text-slate-100 
    hover:bg-slate-200 dark:hover:bg-slate-700
  `,
  // Outline: Borda fina e texto
  outline: `
    bg-transparent border border-slate-200 dark:border-slate-700 
    text-slate-600 dark:text-slate-300 
    hover:bg-slate-50 dark:hover:bg-slate-800
  `,
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20',
  ghost: 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-primary'
}

const sizeClasses = {
  sm: 'h-8 px-3 text-[10px] tracking-widest',
  md: 'h-10 px-5 text-[11px] tracking-widest',
  lg: 'h-12 px-8 text-[12px] tracking-widest'
}

const handleClick = (event) => {
  if (!props.loading && !props.disabled) emit('click', event)
}
</script>