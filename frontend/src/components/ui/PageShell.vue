<template>
  <main
    :class="[
      'w-full animate-page-in',
      padded ? 'px-4 md:px-6 py-6 md:py-8' : 'px-0 py-0',
    ]"
  >
    <div :class="[contained ? 'page-container' : 'w-full max-w-none', 'page-content']">
      <slot />
    </div>
  </main>
</template>

<script setup>
defineProps({
  contained: { type: Boolean, default: false },
  padded: { type: Boolean, default: true },
})
</script>
