<template>
  <div
    class="select-field ds-field w-full flex flex-col gap-1.5"
    :class="{
      'opacity-60 pointer-events-none': disabled,
      'select-field--disabled': disabled,
      'select-field--multiple': multiple,
      'ds-field--line': variant === 'line',
    }"
    @focusin="handleFocus"
    @focusout="handleBlur"
  >
    <SearchInput
      v-if="!multiple"
      :model-value="modelValue"
      col-span="w-full"
      mode="select"
      :label="label"
      :options="normalizedOptions"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :variant="variant"
      hide-search-icon
      @update:model-value="handleSearchUpdate"
    />

    <template v-else>
      <label
        v-if="label"
        :for="selectId"
        class="select-field__label ds-field-label text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-0.5"
      >
        {{ label }}
        <span v-if="required" class="ds-field-label__required text-red-500 ml-0.5">*</span>
      </label>

      <div class="select-field__shell ds-control-shell relative group">
        <select
          :id="selectId"
          :value="modelValue"
          :disabled="disabled"
          :multiple="multiple"
          :size="size"
          :class="selectClasses"
          @change="handleChange"
        >
          <option
            v-if="placeholder && !multiple"
            value=""
            disabled
            :selected="!hasValue"
            class="text-slate-400 dark:text-slate-500"
          >
            {{ placeholder }}
          </option>

          <option
            v-for="option in normalizedOptions"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </option>
        </select>

        <div class="select-field__chevron absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span class="select-field__chevron-pill">
            <i class="pi pi-chevron-down text-[10px]"></i>
          </span>
        </div>
      </div>
    </template>

    <Transition name="slide-up">
      <span v-if="error" class="select-field__message ds-control-message text-[10px] font-bold text-red-500 ml-0.5 tracking-wide">
        {{ error }}
      </span>
    </Transition>

    <div
      v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0"
      class="select-field__meta"
    >
      {{ modelValue.length }} item{{ modelValue.length !== 1 ? 's' : '' }} selecionado{{ modelValue.length !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const props = defineProps({
  modelValue: [String, Number, Array, Boolean],
  options: {
    type: Array,
    default: () => []
  },
  label: String,
  placeholder: String,
  error: String,
  disabled: Boolean,
  required: Boolean,
  multiple: Boolean,
  size: Number,
  id: String,
  forceUpper: { type: Boolean, default: false },
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' }
  ,
  variant: { type: String, default: 'line' }
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

const selectId = ref(props.id || `select-${Math.random().toString(36).slice(2)}`)

const hasValue = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) && props.modelValue.length > 0
  return props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
})

const normalizedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt }
    }
    return {
      label: opt?.[props.labelKey] || String(opt?.value || ''),
      value: opt?.[props.valueKey] !== undefined ? opt[props.valueKey] : opt?.value,
      disabled: opt?.disabled || false
    }
  })
})

const selectClasses = computed(() => ([
  'select-field__control ds-control-input w-full outline-none appearance-none',
  'transition-all duration-200 text-sm',
  props.variant === 'line' ? 'ds-control-input--line select-field__control--line' : '',
  hasValue.value ? 'text-slate-700 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500',
  props.error ? 'ds-control-input--error' : '',
  props.forceUpper ? 'uppercase font-semibold tracking-[0.08em]' : 'font-medium tracking-[0.01em]',
  props.multiple
    ? 'select-field__control--multiple min-h-[7.25rem] h-auto py-3 px-3.5 pr-3'
    : 'h-11 pl-4 pr-14',
]))

const coerceSingleValue = (value) => {
  if (value === 'true') return true
  if (value === 'false') return false
  if (typeof value === 'string' && value !== '' && !isNaN(value)) return Number(value)
  return value
}

const handleSearchUpdate = (value) => {
  const next = coerceSingleValue(value)
  emit('update:modelValue', next)
  emit('change', next)
}

const handleChange = (e) => {
  let value

  if (props.multiple) {
    value = Array.from(e.target.selectedOptions).map((opt) => opt.value)
  } else {
    value = e.target.value
    if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (!isNaN(value) && value !== '') value = Number(value)
  }

  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = (e) => emit('blur', e)
const handleFocus = (e) => emit('focus', e)
</script>

<style scoped>
.select-field__shell {
  position: relative;
}

.select-field__control {
  border-radius: 1rem;
  border-color: rgba(214, 224, 234, 0.92);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.92) 100%);
  box-shadow: 0 12px 30px -24px rgba(25, 43, 68, 0.42);
  cursor: pointer;
}

.select-field__control:hover:not(:disabled) {
  border-color: rgba(44, 111, 163, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(243, 247, 251, 0.96) 100%);
}

.select-field__control:focus {
  border-color: rgba(44, 111, 163, 0.46);
  box-shadow: 0 0 0 4px rgba(44, 111, 163, 0.1), 0 16px 30px -24px rgba(25, 43, 68, 0.46);
}

.select-field__control--multiple {
  padding-right: 0.85rem;
  line-height: 1.45;
}

.select-field__control--line {
  padding-right: 3.25rem !important;
}

.select-field__chevron {
  color: var(--ds-color-text-faint);
}

.group:focus-within .select-field__chevron {
  color: var(--ds-color-primary);
}

.select-field__chevron-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border: 1px solid rgba(214, 224, 234, 0.88);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}

.group:hover .select-field__chevron-pill {
  border-color: rgba(188, 203, 221, 0.96);
}

.group:focus-within .select-field__chevron-pill {
  transform: translateY(-1px);
  border-color: rgba(44, 111, 163, 0.22);
  background: rgba(44, 111, 163, 0.08);
}

.ds-field--line .select-field__chevron-pill {
  width: 1.85rem !important;
  height: 1.85rem !important;
  border-color: rgba(188, 203, 221, 0.88) !important;
  background: rgba(248, 250, 252, 0.96) !important;
  box-shadow: none !important;
}

.select-field__meta {
  margin-left: 0.15rem;
  color: var(--ds-color-text-faint);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dark .select-field__control {
  background: linear-gradient(180deg, rgba(18, 30, 49, 0.94) 0%, rgba(15, 23, 42, 0.92) 100%);
  border-color: rgba(51, 71, 102, 0.88);
  color: #e2e8f0;
}

.dark .select-field__control:hover:not(:disabled) {
  background: linear-gradient(180deg, rgba(22, 36, 58, 0.98) 0%, rgba(17, 27, 45, 0.96) 100%);
}

.dark .select-field__chevron-pill {
  border-color: rgba(51, 71, 102, 0.86);
  background: rgba(15, 23, 42, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

select::-ms-expand {
  display: none;
}

option {
  padding: 0.72rem 0.95rem;
  background-color: #ffffff;
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.35;
}

option[disabled] {
  color: #94a3b8;
  font-weight: 500;
}

option:checked {
  background: linear-gradient(180deg, rgba(44, 111, 163, 0.16) 0%, rgba(44, 111, 163, 0.1) 100%);
  color: var(--ds-color-primary-strong, #1f557d);
}

option:hover,
option:focus,
option:focus-visible,
option:active {
  background: rgba(44, 111, 163, 0.12);
  color: var(--ds-color-primary-strong, #1f557d);
}

.dark option {
  background-color: #1e293b;
  color: #e2e8f0;
}

.dark option[disabled] {
  color: #94a3b8;
}

.dark option:checked,
.dark option:hover,
.dark option:focus,
.dark option:focus-visible,
.dark option:active {
  background: rgba(101, 166, 223, 0.26);
  color: #f8fafc;
}

select[multiple] option:checked {
  background-color: var(--ds-color-primary, #2c6fa3);
  color: white;
}

.slide-up-enter-active { transition: all 0.2s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(-4px); }
</style>
