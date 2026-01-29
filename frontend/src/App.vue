<script setup>
import { computed } from 'vue' // Precisa importar o computed
import { useRoute } from 'vue-router' // Precisa importar o useRoute
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()

// A lógica fica aqui, centralizada
const layout = computed(() => {
  const meta = route.meta
  
  // 1. Se o layout for explicitamente 'auth', usa Auth
  if (meta?.layout === 'auth') return AuthLayout
  
  // 2. Se o layout for explicitamente 'public', usa o Default (com menus, etc)
  if (meta?.layout === 'public') return DefaultLayout
  
  // 3. Regra geral: Se a rota for pública (ex: Login), usa AuthLayout. 
  // Caso contrário (privada), usa DefaultLayout.
  return meta?.public ? AuthLayout : DefaultLayout
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="layout">
      <component :is="Component" />
    </component>
  </RouterView>

  <ConfirmModal />
</template>