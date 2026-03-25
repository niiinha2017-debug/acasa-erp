<template>
  <main
    :class="[
      'w-full animate-page-in min-h-[calc(100vh-4rem)]',
      padded ? 'py-6 md:py-8 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] md:pl-[calc(1.5rem+env(safe-area-inset-left,0px))] md:pr-[calc(1.5rem+env(safe-area-inset-right,0px))] lg:pl-[calc(2rem+env(safe-area-inset-left,0px))] lg:pr-[calc(2rem+env(safe-area-inset-right,0px))]' : 'px-0 py-0',
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
