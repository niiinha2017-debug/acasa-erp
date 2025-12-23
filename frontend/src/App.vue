<script setup>
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const route = useRoute()
</script>

<template>
  <component :is="route.meta?.layout === 'auth' ? AuthLayout : DefaultLayout">
    <router-view />
  </component>
</template>
