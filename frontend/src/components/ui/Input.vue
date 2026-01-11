<template>
  <div class="w-full flex flex-col gap-1.5" :class="{ 'opacity-60 pointer-events-none': disabled }">
    <label v-if="label" :for="inputId" class="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative group">
      <div v-if="$slots.prefix" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        class="w-full h-11 transition-all duration-200 bg-white border rounded-xl text-sm font-semibold text-gray-700 placeholder:text-gray-400 placeholder:font-normal"
        :class="[
          error 
            ? 'border-danger/50 focus:border-danger focus:ring-4 focus:ring-danger/10' 
            : 'border-gray-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10',
          $slots.prefix ? 'pl-11' : 'pl-4',
          $slots.suffix ? 'pr-11' : 'pr-4'
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div v-if="$slots.suffix" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors">
        <slot name="suffix" />
      </div>
    </div>

    <transition name="fade">
      <div v-if="error || hint" class="flex items-center gap-1.5 ml-1">
        <i v-if="error" class="pi pi-exclamation-circle text-[10px] text-danger"></i>
        <span class="text-[11px] font-bold italic" :class="error ? 'text-danger' : 'text-gray-400'">
          {{ error || hint }}
        </span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  label: String,
  placeholder: String,
  error: String,
  hint: String,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  autocomplete: String,
  id: String
})

const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus'])

const inputId = ref(props.id || `input-${Math.random().toString(36).slice(2)}`)

const handleInput = e => {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

const handleBlur = e => emit('blur', e)
const handleFocus = e => emit('focus', e)
</script>