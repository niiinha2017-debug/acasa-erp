<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const route = useRoute()

// Se a rota for login, usa AuthLayout. Para QUALQUER outra, usa DefaultLayout.
const layout = computed(() => {
  if (route.path === '/login') return AuthLayout
  return DefaultLayout
})
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>