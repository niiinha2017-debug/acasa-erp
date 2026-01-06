<script setup>
// Verifique se este caminho está 100% correto
import Menu from '@/layouts/Menu.vue' 
</script>

<template>
  <div class="layout-default">
    <Menu /> 

    <main class="page-content">
      <slot /> 
    </main>
  </div>
</template>