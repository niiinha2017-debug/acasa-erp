<template>
  <div class="loading" :class="{ 'overlay': overlay, 'inline': !overlay }">
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Carregando...'
  },
  overlay: {
    type: Boolean,
    default: false
  }
})
</script>