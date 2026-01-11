<template>
  <div 
    :class="[
      'flex flex-col items-center justify-center gap-3 transition-all duration-300',
      overlay ? 'absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-inherit' : 'p-4'
    ]"
  >
    <div class="relative w-10 h-10">
      <div class="absolute inset-0 border-4 border-brand-primary/10 rounded-full"></div>
      <div class="absolute inset-0 border-4 border-t-brand-primary rounded-full animate-spin"></div>
    </div>
    
    <span 
      v-if="text" 
      class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 animate-pulse"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Carregando'
  },
  overlay: {
    type: Boolean,
    default: false
  }
})
</script>