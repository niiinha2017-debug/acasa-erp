<template>
  <label 
    class="ds-checkbox select-none group"
    :class="[
      disabled 
        ? 'cursor-not-allowed is-disabled' 
        : 'cursor-pointer', 
    ]"
  >
    <div class="relative w-5 h-5 flex-shrink-0 mt-0.5">
      <input 
        type="checkbox" 
        class="ds-checkbox__input absolute opacity-0 w-0 h-0 peer"
        :checked="modelValue" 
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      
      <div
        class="ds-checkbox__box w-full h-full"
      >
        <svg 
          viewBox="0 0 24 24" 
          class="ds-checkbox__icon"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div v-if="label || $slots.default" class="ds-checkbox__content">
      <span class="ds-checkbox__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="ds-checkbox__description">
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
