<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="relative inline-flex items-center justify-center font-black uppercase tracking-[0.15em] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden group rounded-xl shrink-0"
    :class="[
      variantClasses[variant] || 'btn-primary-tw',
      sizeClasses[size],
      { 'w-full': fullWidth, 'shadow-lg shadow-black/10': variant !== 'ghost' }
    ]"
    @click="handleClick"
  >
    <div v-if="!['ghost', 'outline'].includes(variant)" class="absolute inset-0 z-0 pointer-events-none">
      <div class="absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-white/20 to-transparent"></div>
      <div class="absolute -left-[100%] top-0 w-[60%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-700 ease-in-out"></div>
    </div>

    <svg v-if="loading" class="animate-spin h-5 w-5 absolute z-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <span 
      :class="[
        { 'opacity-0': loading },
        // Texto adaptativo: No secondary Dark, ele fica branco; no Light, quase preto.
        variant === 'ghost' ? 'text-slate-500 dark:text-slate-400 group-hover:text-brand-primary' : 
        variant === 'secondary' ? 'text-slate-700 dark:text-slate-100' :
        'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
      ]" 
      class="relative z-10 flex items-center gap-2"
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
  // Primário: Mantém o azul luxuoso (funciona bem em ambos)
  primary: `
    bg-gradient-to-b from-[#4A82B0] via-[#3a78a8] to-[#2c5a7d] 
    border-b-[4px] border-black/30
    hover:brightness-110 hover:shadow-[#3a78a8]/40
  `,
  // Secundário: Agora ele escurece no Dark Mode
  secondary: `
    bg-gradient-to-b from-white via-[#f8fafc] to-[#e2e8f0] 
    dark:from-slate-700 dark:via-slate-800 dark:to-slate-900
    border-b-[4px] border-[#cbd5e1] dark:border-slate-950/50
    hover:brightness-105
  `,
  danger: 'bg-gradient-to-b from-red-400 via-red-500 to-red-700 border-b-[4px] border-red-900/30',
  success: 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 border-b-[4px] border-emerald-900/30',
  ghost: 'btn-ghost-tw shadow-none',
  outline: 'btn-outline-tw'
}

const sizeClasses = {
  sm: 'h-9 px-4 text-[10px] tracking-widest',
  md: 'h-11 px-7 text-[11px] tracking-[0.2em]',
  lg: 'h-14 px-10 text-[13px] tracking-[0.2em]'
}

const handleClick = (event) => {
  if (!props.loading && !props.disabled) emit('click', event)
}
</script>