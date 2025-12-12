<script setup>
import Menu from '../components/Menu.vue';
import ClientesList from './Clientes/ClientesList.vue';
</script>

<template>
  <Menu />

  <main class="app-content">
    <ClientesList />
  </main>
</template>

<style>
.app-content {
  padding-top: 70px; /* espaço do menu */
}
</style>
