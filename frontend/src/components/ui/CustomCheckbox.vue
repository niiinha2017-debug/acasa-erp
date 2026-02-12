<template>
  <label 
    class="flex items-start gap-3 p-2 rounded-xl transition-all duration-200 select-none group"
    :class="[
      disabled 
        ? 'cursor-not-allowed opacity-40' 
        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50', 
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
        class="w-full h-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center transition-all duration-200
               group-hover:border-slate-300 dark:group-hover:border-slate-600
               peer-checked:bg-brand-primary peer-checked:border-brand-primary
               peer-focus:ring-4 peer-focus:ring-brand-primary/10"
      >
        <svg 
          viewBox="0 0 24 24" 
          class="w-3 h-3 fill-none stroke-white stroke-[4] transition-all duration-200 scale-0 peer-checked:scale-100"
          style="stroke-linecap: round; stroke-linejoin: round;"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div v-if="label || $slots.default" class="flex flex-col pt-0.5 pointer-events-none">
      <span class="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
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