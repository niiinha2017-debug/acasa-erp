<template>
  <div
    class="input-wrapper"
    :class="{ 'has-error': error, 'is-disabled': disabled }"
  >
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div class="input-container">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        class="input-field"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <span v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix" />
      </span>

      <span v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix" />
      </span>
    </div>

    <div v-if="error || hint" class="input-message">
      <span v-if="error" class="input-error">{{ error }}</span>
      <span v-else class="input-hint">{{ hint }}</span>
    </div>
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

const inputId = ref(
  props.id || `input-${Math.random().toString(36).slice(2)}`
)

const handleInput = e => {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

const handleBlur = e => emit('blur', e)
const handleFocus = e => emit('focus', e)
</script>

<style scoped>
/* =====================================================
   WRAPPER
===================================================== */
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* =====================================================
   LABEL
===================================================== */
.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
}

.required {
  color: var(--danger);
  margin-left: 2px;
}

/* =====================================================
   CONTAINER
===================================================== */
.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* =====================================================
   INPUT
===================================================== */
.input-field {
  width: 100%;
  height: var(--control-height-md);
  padding: 0 16px;

  font-family: var(--font-main);
  font-size: var(--font-size-md);

  color: var(--text-main);
  background: var(--bg-input);

  border-radius: var(--control-radius-md);
  border: 1px solid var(--border-soft);

  transition: var(--transition-base);
}

.input-field::placeholder {
  color: var(--text-muted);
}

/* Focus */
.input-field:focus {
  outline: none;
  border-color: var(--border-focus);
  background: var(--bg-card);
  box-shadow: var(--focus-ring);
}

/* Disabled */
.is-disabled .input-field {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =====================================================
   ERROR STATE
===================================================== */
.has-error .input-field {
  border-color: var(--danger);
  background: var(--danger-bg);
}

.has-error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(220,38,38,.2);
}

/* =====================================================
   PREFIX / SUFFIX
===================================================== */
.input-prefix,
.input-suffix {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.input-prefix {
  left: 12px;
}

.input-suffix {
  right: 12px;
}

.input-field:has(+ .input-prefix),
.input-field:has(~ .input-prefix) {
  padding-left: 40px;
}

.input-field:has(+ .input-suffix),
.input-field:has(~ .input-suffix) {
  padding-right: 40px;
}

/* =====================================================
   MESSAGES
===================================================== */
.input-message {
  min-height: 18px;
}

.input-error {
  font-size: var(--font-size-sm);
  color: var(--danger);
  font-weight: var(--font-weight-medium);
}

.input-hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
</style>
