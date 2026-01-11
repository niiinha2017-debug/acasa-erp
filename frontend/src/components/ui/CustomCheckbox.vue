<template>
  <label 
    class="flex items-start gap-3 p-2 rounded-xl transition-all select-none group"
    :class="[
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-brand-primary/5',
    ]"
  >
    <div class="relative w-5 h-5 flex-shrink-0 mt-0.5">
      <input 
        type="checkbox" 
        class="absolute opacity-0 w-0 h-0 peer"
        :checked="modelValue" 
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      
      <div 
        class="w-full h-full bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center transition-all duration-200
               peer-checked:bg-brand-primary peer-checked:border-brand-primary peer-focus:ring-2 peer-focus:ring-brand-primary/20"
      >
        <svg 
          viewBox="0 0 24 24" 
          class="w-3.5 h-3.5 fill-none stroke-white stroke-[4] transition-transform duration-200 scale-0 peer-checked:scale-100"
          style="stroke-linecap: round; stroke-linejoin: round;"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div v-if="label || $slots.default" class="flex flex-col leading-tight">
      <span class="text-sm font-bold text-gray-800">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="text-xs text-gray-500 mt-0.5">
        {{ description }}
      </span>
    </div>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  label: String,
  description: String,
  disabled: Boolean
})
defineEmits(['update:modelValue'])
</script>