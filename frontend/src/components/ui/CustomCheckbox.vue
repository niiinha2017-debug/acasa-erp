<template>
  <label class="custom-checkbox" :class="{ 'is-checked': modelValue, 'is-disabled': disabled }">
    <div class="checkbox-wrapper">
      <input 
        type="checkbox" 
        :checked="modelValue" 
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <div class="checkbox-box">
        <svg viewBox="0 0 24 24" class="check-icon">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="checkbox-label" v-if="label || $slots.default">
      <span class="label-main"><slot>{{ label }}</slot></span>
      <span v-if="description" class="label-description">{{ description }}</span>
    </div>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  label: String,
  description: String,
  disabled: Boolean
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.custom-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  user-select: none;
}

.custom-checkbox:hover:not(.is-disabled) {
  background-color: rgba(37, 99, 235, 0.05);
}

.checkbox-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Esconde o checkbox original mas mantém acessível */
input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0; width: 0;
}

.checkbox-box {
  width: 100%;
  height: 100%;
  background-color: #fff;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: white;
  stroke-width: 4px;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: scale(0);
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Estados */
.is-checked .checkbox-box {
  background-color: #2563eb;
  border-color: #2563eb;
}

.is-checked .check-icon {
  transform: scale(1);
}

.checkbox-label {
  display: flex;
  flex-direction: column;
}

.label-main {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1f2937;
}

.label-description {
  font-size: 0.8rem;
  color: #6b7280;
}

.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
/* Classes dinâmicas baseadas no banco */
.badge-constant {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  /* A cor de fundo vira a cor do banco com opacidade */
  background-color: var(--bg-color);
  color: var(--text-color);
}
</style>