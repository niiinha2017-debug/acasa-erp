<template>
  <div
    class="card"
    :class="{
      'card--shadow': shadow,
      'card--hoverable': hoverable
    }"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  shadow: { type: Boolean, default: true },
  hoverable: { type: Boolean, default: false }
})
</script>
