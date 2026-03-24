<template>
  <div
    class="ds-card"
    :class="[
      variant === 'default'
        ? 'ds-card--default'
        : 'ds-card--contrast',
      {
        'ds-card--shadow': shadow && !hoverable && variant === 'default',
        'ds-card--hoverable': hoverable,
        'ds-card--active': active,
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
