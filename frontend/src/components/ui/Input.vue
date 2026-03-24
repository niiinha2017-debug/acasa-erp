<template>
  <div
    class="ds-field"
    :class="{
      'ds-field--disabled': disabled && !keepReadableWhenDisabled,
      'ds-field--readonly-disabled': disabled && keepReadableWhenDisabled,
      'ds-field--line': variant === 'line',
    }"
  >
    <label
      v-if="label"
      :for="inputId"
      class="ds-field-label"
    >
      {{ label }}
      <span v-if="required" class="ds-field-label__required">*</span>
    </label>

    <div class="ds-control-shell group">
      <div
        v-if="$slots.prefix"
        class="ds-control-icon ds-control-icon--left"
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
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete || undefined"
        :spellcheck="spellcheckAtivo"
        :lang="spellcheckAtivo ? 'pt-BR' : undefined"
        :class="[
          'ds-control-input',
          {
            'ds-control-input--error': error,
            'ds-control-input--with-prefix': $slots.prefix,
            'ds-control-input--with-suffix': $slots.suffix,
            'ds-control-input--line': variant === 'line',
            'uppercase': forceUpper && type !== 'password',
            'ds-control-input--soft-disabled': disabled && !keepReadableWhenDisabled,
            'ds-control-input--readable-disabled': disabled && keepReadableWhenDisabled
          }
        ]"
        @input="handleInput"
        @blur="e => emit('blur', e)"
        @focus="e => emit('focus', e)"
      />

      <div
        v-if="$slots.suffix"
        class="ds-control-icon ds-control-icon--right"
      >
        <slot name="suffix" />
      </div>
    </div>

    <Transition name="slide-up">
      <span v-if="error" class="ds-control-message">
        {{ error }}
      </span>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
  min: [String, Number],
  max: [String, Number],
  step: [String, Number],
  autocomplete: String,
  name: String, // ✅ ADD
  id: String,
  forceUpper: { type: Boolean, default: true },
  /** Quando true, campo disabled mantém texto escuro/legível (ex.: valor final da venda). */
  keepReadableWhenDisabled: { type: Boolean, default: false },
  /** Corretor ortográfico em PT-BR. Default true para type text/search/email. */
  spellcheck: { type: Boolean, default: undefined },
  variant: { type: String, default: 'line' }
})


const emit = defineEmits(['update:modelValue', 'input', 'blur', 'focus'])
const inputId = ref(props.id || `input-${Math.random().toString(36).slice(2)}`)

const tiposComSpellcheck = ['text', 'search', 'email']
const spellcheckAtivo = computed(() => {
  if (props.spellcheck !== undefined) return props.spellcheck
  return tiposComSpellcheck.includes(props.type)
})

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

/* Evita controles duplicados/feios em inputs de data/hora (Edge/Chrome/WebKit) */
input[type='date']::-webkit-clear-button,
input[type='date']::-webkit-inner-spin-button,
input[type='time']::-webkit-clear-button,
input[type='time']::-webkit-inner-spin-button,
input[type='datetime-local']::-webkit-clear-button,
input[type='datetime-local']::-webkit-inner-spin-button {
  display: none;
}

input[type='date']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator,
input[type='datetime-local']::-webkit-calendar-picker-indicator {
  opacity: 0.65;
  cursor: pointer;
}
</style>
