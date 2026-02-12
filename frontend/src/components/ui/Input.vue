<template>
  <div class="w-full flex flex-col gap-1.5" :class="{ 'opacity-60 pointer-events-none': disabled }">
    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-semibold tracking-wide text-text-soft ml-0.5 mb-0.5"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500 ml-0.5">*</span>
    </label>

    <div class="relative group">
      <div
        v-if="$slots.prefix"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors duration-200"
      >
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :name="name || undefined"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete || undefined"
        :class="[
          'w-full h-10 border rounded-xl text-sm transition-all duration-200',
          'bg-bg-card text-text-main',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal',
          error
            ? 'border-rose-300 ring-2 ring-rose-100 dark:border-rose-800 dark:ring-rose-900/30'
            : 'border-border-ui hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10',
          $slots.prefix ? 'pl-10' : 'pl-3',
          $slots.suffix ? 'pr-10' : 'pr-3',
          { 'uppercase': forceUpper && type !== 'password', 'opacity-50 bg-slate-50 dark:bg-slate-800': disabled }
        ]"
        @input="handleInput"
        @blur="e => emit('blur', e)"
        @focus="e => emit('focus', e)"
      />

      <div
        v-if="$slots.suffix"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors duration-200"
      >
        <slot name="suffix" />
      </div>
    </div>

    <Transition name="slide-up">
      <span v-if="error" class="text-[10px] font-bold text-red-500 ml-0.5 tracking-wide">
        {{ error }}
      </span>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { upper } from '@/utils/text'

const props = defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  label: String,
  placeholder: String,
  error: String,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  autocomplete: String,
  name: String, // ✅ ADD
  id: String,
  forceUpper: { type: Boolean, default: true }
})


const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus'])
const inputId = ref(props.id || `input-${Math.random().toString(36).slice(2)}`)

const handleInput = (e) => {
  let value = e.target.value
  if (props.forceUpper && props.type !== 'password') value = upper(value)
  emit('update:modelValue', value)
  emit('input', e)
}
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.2s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(-4px); }
</style>
