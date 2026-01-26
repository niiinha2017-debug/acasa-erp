<template>
  <div class="w-full flex flex-col gap-1.5" :class="{ 'opacity-60 pointer-events-none': disabled }">
    <label 
      v-if="label" 
      :for="inputId" 
      class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
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
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        
        :class="[
          /* ESTRUTURA BASE: Borda menor (lg) para seriedade */
          'w-full h-10 transition-all duration-200 border rounded-lg text-sm font-medium outline-none',
          
          /* TEMA: Fundo sólido com bordas leves */
          'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
          
          /* PLACEHOLDER: Normal case para não poluir visualmente */
          'placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:lowercase placeholder:text-xs',
          
          /* ESTADOS: Foco elegante com anel fino */
          error 
            ? 'border-red-500 ring-2 ring-red-500/10' 
            : 'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 hover:border-slate-300 dark:hover:border-slate-600',
          
          /* PADDINGS ADAPTATIVOS */
          $slots.prefix ? 'pl-11' : 'pl-4',
          $slots.suffix ? 'pr-11' : 'pr-4',
          
          /* CASE CONTROL */
          { 'uppercase font-bold tracking-wide': forceUpper && type !== 'password' } 
        ]"
        
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
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
  id: String,
  forceUpper: { type: Boolean, default: false } // Desativado por padrão para inputs mais limpos
})

const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus'])
const inputId = ref(props.id || `input-${Math.random().toString(36).slice(2)}`)

const handleInput = e => {
  let value = e.target.value
  if (props.forceUpper && props.type !== 'password') value = upper(value)
  emit('update:modelValue', value)
  emit('input', e)
}

const handleBlur = e => emit('blur', e)
const handleFocus = e => emit('focus', e)
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.2s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(-4px); }

input:-webkit-autofill {
  -webkit-text-fill-color: var(--text-main) !important;
  -webkit-box-shadow: 0 0 0px 1000px white inset !important;
}

.dark input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0px 1000px #1e293b inset !important;
}
</style>