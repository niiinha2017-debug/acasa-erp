<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="relative inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': fullWidth }
    ]"
    @click="handleClick"
  >
    <svg v-if="loading" class="animate-spin h-5 w-5 absolute" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <span :class="{ 'opacity-0': loading }" class="flex items-center gap-2">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'button' },
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary', 'outline', 'danger', 'success'].includes(v)
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

// Mapeamento de Estilos com Tailwind v4
const variantClasses = {
  primary: 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-dark rounded-xl',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl',
  outline: 'bg-transparent border-2 border-gray-200 text-gray-600 hover:border-brand-primary hover:text-brand-primary rounded-xl',
  danger: 'bg-red-50 text-danger hover:bg-danger hover:text-white rounded-xl',
  success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl'
}

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-14 px-8 text-base gap-3'
}

const handleClick = (event) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>