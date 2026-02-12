<template>
  <div class="w-full flex flex-col gap-1.5" :class="{ 'opacity-60 pointer-events-none': disabled }">
    <div class="relative group">
      <div
        v-if="$slots.prefix"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-brand-primary transition-colors duration-200"
      >
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :name="name || undefined"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder || ' '"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete || undefined"
        :class="[
          'peer w-full h-10 pt-4 pb-1 border-b text-sm transition-all duration-200 bg-transparent',
          'text-text-main',
          'placeholder:text-transparent focus:placeholder:text-text-soft',
          error
            ? 'border-rose-400'
            : 'border-border-ui hover:border-slate-400 dark:hover:border-slate-500 focus:border-brand-primary',
          $slots.prefix ? 'pl-10' : 'pl-1',
          $slots.suffix ? 'pr-10' : 'pr-1',
          { 'uppercase': forceUpper && type !== 'password', 'opacity-50': disabled }
        ]"
        @input="handleInput"
        @blur="e => emit('blur', e)"
        @focus="e => emit('focus', e)"
      />

      <label
        v-if="label"
        :for="inputId"
        :class="[
          'absolute left-0 top-1/2 -translate-y-1/2 text-sm text-text-soft transition-all duration-200 cursor-text px-1 bg-bg-page',
          $slots.prefix ? 'pl-10' : 'pl-1',
          'peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-primary peer-focus:-translate-y-1/2',
          'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-translate-y-1/2'
        ]"
      >
        {{ label }}
        <span v-if="required" class="text-rose-500 ml-0.5">*</span>
      </label>

      <div
        v-if="$slots.suffix"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-brand-primary transition-colors duration-200"
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
