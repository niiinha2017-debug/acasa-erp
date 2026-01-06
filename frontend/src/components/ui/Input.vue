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

