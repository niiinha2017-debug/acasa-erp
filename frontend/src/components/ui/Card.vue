<template>
  <div
    class="bg-white rounded-2xl border border-gray-100 transition-all duration-300"
    :class="[
      { 
        'shadow-sm hover:shadow-md': shadow && !hoverable,
        'shadow-xl shadow-gray-200/50': shadow && hoverable,
        'hover:-translate-y-1 hover:border-brand-primary/30 cursor-pointer': hoverable,
        'overflow-hidden': !shadow // Opcional: só usa hidden se não tiver sombra
      }
    ]"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  shadow: { 
    type: Boolean, 
    default: true 
  },
  hoverable: { 
    type: Boolean, 
    default: false 
  }
})
</script>