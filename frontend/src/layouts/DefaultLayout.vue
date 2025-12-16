<template>
  <div class="layout">
    <Menu />
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Menu from './Menu.vue'
</script>
