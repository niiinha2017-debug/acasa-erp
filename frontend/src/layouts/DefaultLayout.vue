<template>
  <div class="min-h-screen bg-bg-page text-text-main transition-colors duration-300">
    
    <Menu />

    <main class="max-w-[1700px] mx-auto px-4 md:px-8 py-6 md:py-10 animate-page-in">
      <div class="flex flex-col gap-6">
        <slot />
      </div>
    </main>

  </div>
</template>

<script setup>
import Menu from '@/layouts/Menu.vue'
</script>
