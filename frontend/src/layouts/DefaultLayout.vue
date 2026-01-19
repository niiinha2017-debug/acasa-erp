<template>
  <div class="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-300">
    
    <Menu />

    <main class="max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in">
      <slot />
    </main>

  </div>
</template>

<script setup>
import Menu from '@/layouts/Menu.vue'
</script>

<style scoped>
/* Uma animação sutil para quando o usuário navega entre as telas */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>