<script setup>
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component
      :is="
        route.meta?.layout === 'auth'
          ? AuthLayout
          : route.meta?.layout === 'public'
          ? DefaultLayout
          : route.meta?.public
          ? AuthLayout
          : DefaultLayout
      "
    >
      <component :is="Component" />
    </component>
  </RouterView>

  <ConfirmModal />
</template>

