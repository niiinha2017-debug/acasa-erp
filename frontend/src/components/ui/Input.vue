<template>
  <div class="w-full flex flex-col gap-1.5" :class="{ 'opacity-50 pointer-events-none': disabled }">
    <label v-if="label" :for="inputId" class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 ml-1">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative group">
      <div v-if="$slots.prefix" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors duration-300">
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="type === 'password' ? 'current-password' : 'one-time-code'"
        :name="type === 'password' ? 'password' : `field_${inputId}`"

        :class="[
          'w-full h-11 transition-all duration-300 border rounded-2xl text-sm font-bold outline-none',
          
          /* CORES DINÂMICAS BASEADAS NO SEU TEMA */
          /* No Light: fundo branco | No Dark: fundo do card (#1e293b) */
          'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-ui)]',
          
          /* PLACEHOLDER: Cinza médio para leitura clara */
          'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest',
          
          /* ESTADO DE FOCO: O fundo se mantém escuro no dark */
          error 
            ? 'border-danger ring-4 ring-danger/10' 
            : 'focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10',
          
          /* PADDINGS */
          $slots.prefix ? 'pl-11' : 'pl-5',
          $slots.suffix ? 'pr-11' : 'pr-5',
          
          /* CASE */
          { 'uppercase': forceUpper && type !== 'password' } 
        ]"
        
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div v-if="$slots.suffix" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors duration-300">
        <slot name="suffix" />
      </div>
    </div>

    <span v-if="error" class="text-[10px] font-bold uppercase text-danger ml-1 tracking-tight">
      {{ error }}
    </span>
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
  hint: String,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  autocomplete: String,
  id: String,
  forceUpper: { type: Boolean, default: true } 
})

const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus'])

const inputId = ref(props.id || `input-${Math.random().toString(36).slice(2)}`)

const handleInput = e => {
  let value = e.target.value
  if (props.forceUpper && props.type !== 'password') {
    value = upper(value)
  }
  emit('update:modelValue', value)
  emit('input', e)
}

const handleBlur = e => emit('blur', e)
const handleFocus = e => emit('focus', e)
</script>

<style scoped>
/* Mata o fundo branco do autofill respeitando o seu tema dark */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-main) !important;
  -webkit-box-shadow: 0 0 0px 1000px var(--bg-card) inset !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>