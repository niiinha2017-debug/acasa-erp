<template>
  <div class="input-wrapper" :class="{ 'has-error': error, 'disabled': disabled }">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="input-container">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        class="input-field"
      />
      
      <div v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix"></slot>
      </div>
      
      <div v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix"></slot>
      </div>
    </div>
    
    <div v-if="error || hint" class="input-message">
      <span v-if="error" class="input-error">{{ error }}</span>
      <span v-else-if="hint" class="input-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text'
  },
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

const inputId = ref(props.id || `input-${Math.random().toString(36).substr(2, 9)}`)

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
  emit('input', event)
}

const handleBlur = (event) => {
  emit('blur', event)
}

const handleFocus = (event) => {
  emit('focus', event)
}

onMounted(() => {
  if (!props.id) {
    inputId.value = `input-${Math.random().toString(36).substr(2, 9)}`
  }
})
</script>

<style scoped>
.input-wrapper {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  font-size: 15px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  color: #1e293b;
  transition: all 0.2s ease;
  font-family: inherit;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f1f5f9;
}

/* Error state */
.input-wrapper.has-error .input-field {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.input-wrapper.has-error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Prefix/Suffix */
.input-prefix,
.input-suffix {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #64748b;
}

.input-prefix {
  left: 12px;
}

.input-suffix {
  right: 12px;
}

.input-field:has(~ .input-prefix) {
  padding-left: 40px;
}

.input-field:has(~ .input-suffix) {
  padding-right: 40px;
}

/* Messages */
.input-message {
  margin-top: 4px;
  min-height: 20px;
}

.input-error {
  font-size: 13px;
  color: #ef4444;
  font-weight: 500;
}

.input-hint {
  font-size: 12px;
  color: #64748b;
}
</style>