<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--loading': loading, 'btn--full': fullWidth }
    ]"
    @click="handleClick"
  >
    <span v-if="loading" class="btn__spinner"></span>
    <span v-if="!loading"><slot>{{ label }}</slot></span>
    <span v-if="loading && loadingText">{{ loadingText }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'button' },
  variant: {
    type: String,
    default: 'primary',
    validator: v =>
      ['primary', 'secondary', 'outline', 'danger', 'success'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
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
/* =====================================================
   BASE
===================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  font-family: var(--font-main);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);

  height: var(--control-height-md);
  padding: 0 20px;

  border-radius: var(--control-radius-md);
  border: 1px solid transparent;
  cursor: pointer;

  transition: var(--transition-base);
}

.btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

/* =====================================================
   SIZES
===================================================== */
.btn--sm {
  height: var(--control-height-sm);
  padding: 0 14px;
  font-size: var(--font-size-sm);
}

.btn--lg {
  height: var(--control-height-lg);
  padding: 0 24px;
  font-size: var(--font-size-lg);
}

/* =====================================================
   VARIANTS
===================================================== */
.btn--primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.35),
    transparent
  );

  transition: left 0.6s ease;
}



.btn--primary:hover:not(:disabled) {
  background: var(--brand-primary-dark);
}

.btn--secondary {
  background: var(--bg-card);
  color: var(--text-main);
  border-color: var(--border-soft);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn--outline {
  background: transparent;
  color: var(--brand-primary);
  border-color: var(--brand-primary);
}

.btn--outline:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn--danger {
  background: var(--danger);
  color: var(--text-invert);
}

.btn--danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn--success {
  background: #16a34a;
  color: var(--text-invert);
}

/* =====================================================
   STATES
===================================================== */
.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.btn--loading {
  pointer-events: none;
}

.btn--full {
  width: 100%;
}

/* =====================================================
   SPINNER
===================================================== */
.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

.btn--secondary .btn__spinner,
.btn--outline .btn__spinner {
  border-color: rgba(58,120,168,.3);
  border-top-color: var(--brand-primary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
