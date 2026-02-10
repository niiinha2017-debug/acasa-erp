<template>
  <div class="min-h-screen bg-bg-page text-text-main transition-colors duration-300">
    <Menu />
    <PageShell :contained="false" :padded="true">
      <slot />
    </PageShell>
  </div>
</template>

<script setup>
import Menu from '@/layouts/Menu.vue'
import PageShell from '@/components/ui/PageShell.vue'
</script>
