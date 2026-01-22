<template>
  <label 
    class="flex items-start gap-4 p-3 rounded-2xl transition-all duration-300 select-none group"
    :class="[
      disabled 
        ? 'cursor-not-allowed opacity-40' 
        : 'cursor-pointer hover:bg-slate-500/5', 
    ]"
  >
    <div class="relative w-6 h-6 flex-shrink-0 mt-0.5">
      <input 
        type="checkbox" 
        class="absolute opacity-0 w-0 h-0 peer"
        :checked="modelValue" 
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      
<div
  class="w-full h-full bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center transition-all duration-300
         hover:bg-slate-200
         peer-checked:bg-brand-primary peer-checked:border-brand-primary
         peer-checked:shadow-[0_4px_12px_rgba(58,120,168,0.3)]
         peer-focus:ring-4 peer-focus:ring-brand-primary/10"
>

        <svg 
          viewBox="0 0 24 24" 
          class="w-3.5 h-3.5 fill-none stroke-white stroke-[3.5] transition-all duration-300 scale-0 peer-checked:scale-100"
          style="stroke-linecap: round; stroke-linejoin: round;"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div v-if="label || $slots.default" class="flex flex-col pt-0.5">
      <span class="text-[13px] font-black uppercase tracking-tight text-[var(--text-main)] transition-colors">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-relaxed uppercase tracking-wider transition-colors">
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