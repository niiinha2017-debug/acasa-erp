<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    :class="['btn', variant, size, { 'loading': loading, 'full-width': fullWidth }]"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <slot v-if="!loading">{{ label }}</slot>
    <span v-if="loading && loadingText">{{ loadingText }}</span>
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'button'
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'danger', 'success'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  label: String,
  loading: Boolean,
  loadingText: String,
  disabled: Boolean,
  fullWidth: Boolean
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn.secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn.outline {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn.danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn.success {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* Sizes */
.btn.sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn.md {
  padding: 10px 20px;
  font-size: 14px;
}

.btn.lg {
  padding: 14px 28px;
  font-size: 16px;
}

/* Hover effects */
.btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn.secondary:hover:not(:disabled) {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.btn.outline:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.1);
}

.btn.danger:hover:not(:disabled) {
  background: #fecaca;
  transform: translateY(-1px);
}

.btn.success:hover:not(:disabled) {
  background: #bbf7d0;
  transform: translateY(-1px);
}

/* Loading state */
.btn.loading {
  cursor: wait;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.btn.outline .btn-spinner {
  border-color: rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
}

.btn.secondary .btn-spinner {
  border-color: rgba(71, 85, 105, 0.3);
  border-top-color: #475569;
}

/* Full width */
.btn.full-width {
  width: 100%;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>