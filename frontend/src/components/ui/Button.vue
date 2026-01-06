<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--loading': loading, 'btn--full': fullWidth }
    ]"
    @click="handleClick"
  >
    <span v-if="loading" class="btn__spinner"></span>
    <span v-if="!loading"><slot>{{ label }}</slot></span>
    <span v-if="loading && loadingText">{{ loadingText }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'button' },
  variant: {
    type: String,
    default: 'primary',
    validator: v =>
      ['primary', 'secondary', 'outline', 'danger', 'success'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  label: String,
  loading: Boolean,
  loadingText: String,
  disabled: Boolean,
  fullWidth: Boolean
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>