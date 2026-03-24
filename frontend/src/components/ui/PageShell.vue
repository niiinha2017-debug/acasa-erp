<template>
  <main
    :class="[
      'ds-page-shell animate-page-in',
      variant === 'minimal' ? 'ds-page-shell--minimal' : '',
      padded ? 'ds-page-shell--padded' : 'ds-page-shell--fluid',
    ]"
  >
    <div :class="[contained ? 'ds-page-shell--contained' : 'w-full max-w-none', 'ds-page-shell__content']">
      <slot />
    </div>
  </main>
</template>

<script setup>
defineProps({
  contained: { type: Boolean, default: false },
  padded: { type: Boolean, default: true },
  variant: { type: String, default: 'default' },
})
</script>
