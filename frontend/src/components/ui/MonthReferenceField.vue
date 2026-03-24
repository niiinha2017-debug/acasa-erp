<template>
  <div class="month-reference-field">
    <label class="month-reference-field__label" :for="inputId">{{ label }}</label>

    <div
      class="month-reference-field__shell"
      :class="{ 'month-reference-field__shell--disabled': disabled }"
      :tabindex="disabled ? -1 : 0"
      role="button"
      :aria-disabled="disabled ? 'true' : 'false'"
      @click="openPicker"
      @keydown="onKeydown"
    >
      <input
        ref="inputRef"
        :id="inputId"
        :value="normalizedValue"
        :disabled="disabled"
        type="month"
        class="month-reference-field__native"
        @input="onInput"
      />

      <div class="month-reference-field__display" aria-hidden="true">
        <span class="month-reference-field__icon month-reference-field__icon--left">
          <i class="pi pi-calendar"></i>
        </span>

        <span class="month-reference-field__value">{{ displayValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Mês de referência',
  },
  placeholder: {
    type: String,
    default: 'Selecione o mês',
  },
  id: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const instance = getCurrentInstance()
const inputRef = ref(null)

const inputId = computed(() => props.id || `month-reference-field-${instance?.uid ?? 'default'}`)

const normalizedValue = computed(() => {
  const value = String(props.modelValue || '').trim()
  return /^\d{4}-\d{2}$/.test(value) ? value : ''
})

const displayValue = computed(() => {
  if (!normalizedValue.value) return props.placeholder

  const [year, month] = normalizedValue.value.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
})

function onInput(event) {
  emit('update:modelValue', event?.target?.value || '')
}

function openPicker() {
  if (props.disabled) return

  const input = inputRef.value
  if (!input) return

  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }

  input.focus()
  input.click()
}

function onKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  openPicker()
}
</script>

<style scoped>
.month-reference-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
}

.month-reference-field__label {
  padding-left: 0.1rem;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ds-color-text-soft, #7c8aa5);
}

.month-reference-field__shell {
  position: relative;
  min-height: 2.45rem;
  border: 1px solid rgba(191, 203, 221, 0.9);
  border-radius: 1rem;
  background: #ffffff;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  overflow: hidden;
  cursor: pointer;
}

.month-reference-field__shell:focus-within {
  border-color: rgba(74, 124, 179, 0.65);
  background: #ffffff;
}

.month-reference-field__shell:focus-visible {
  outline: none;
  border-color: rgba(74, 124, 179, 0.65);
  box-shadow: 0 0 0 3px rgba(74, 124, 179, 0.12);
}

.month-reference-field__shell--disabled {
  opacity: 0.6;
}

.month-reference-field__native {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
}

.month-reference-field__native:disabled {
  cursor: not-allowed;
}

.month-reference-field__display {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.45rem;
  padding: 0.58rem 0.9rem;
  pointer-events: none;
}

.month-reference-field__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8fa0b8;
  flex-shrink: 0;
}

.month-reference-field__icon--left {
  width: 1rem;
  font-size: 0.78rem;
}

.month-reference-field__value {
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.1;
  color: #14233a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .month-reference-field__value {
    font-size: 0.9rem;
  }
}

:global(.dark) .month-reference-field__label {
  color: rgba(226, 232, 240, 0.7);
}

:global(.dark) .month-reference-field__shell {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.92);
}

:global(.dark) .month-reference-field__shell:focus-within {
  border-color: rgba(125, 171, 220, 0.6);
}

:global(.dark) .month-reference-field__icon {
  color: rgba(191, 219, 254, 0.72);
}

:global(.dark) .month-reference-field__value {
  color: #f8fafc;
}
</style>