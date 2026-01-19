<script setup>
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="route.meta?.public ? AuthLayout : DefaultLayout">
      <component :is="Component" />
    </component>
  </RouterView>
</template>
