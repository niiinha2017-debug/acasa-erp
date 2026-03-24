<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="ds-btn"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': fullWidth }
    ]"
    @click="handleClick"
  >
    <svg v-if="loading" class="ds-btn__spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <span
      class="ds-btn__content"
      :class="[
        { 'opacity-0': loading }
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
  primary: 'ds-btn--primary',
  secondary: 'ds-btn--secondary',
  outline: 'ds-btn--outline',
  danger: 'ds-btn--danger',
  success: 'ds-btn--success',
  ghost: 'ds-btn--ghost'
}

const sizeClasses = {
  sm: 'ds-btn--sm',
  md: 'ds-btn--md',
  lg: 'ds-btn--lg'
}

const handleClick = (event) => {
  if (!props.loading && !props.disabled) emit('click', event)
}
</script>
