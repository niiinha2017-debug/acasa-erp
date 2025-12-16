<template>
  <div
    class="card"
    :class="{
      'card--hoverable': hoverable,
      'card--shadow': shadow
    }"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  hoverable: { type: Boolean, default: false },
  shadow: { type: Boolean, default: true }
})
</script>

<style scoped>
/* =====================================================
   BASE
===================================================== */
.card {
  background: var(--bg-card);
  border-radius: var(--card-radius);
  border: 1px solid var(--border-soft);
  overflow: hidden;
  transition: var(--transition-base);
}

/* =====================================================
   SHADOW
===================================================== */
.card--shadow {
  box-shadow: var(--card-shadow);
}

/* =====================================================
   HOVER
===================================================== */
.card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* =====================================================
   HEADER
===================================================== */
.card-header {
  padding: 16px 20px;
  background: var(--bg-input);
  border-bottom: 1px solid var(--border-soft);
}

.card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

/* =====================================================
   BODY
===================================================== */
.card-body {
  padding: 20px;
}

/* =====================================================
   FOOTER
===================================================== */
.card-footer {
  padding: 16px 20px;
  background: var(--bg-input);
  border-top: 1px solid var(--border-soft);
}
</style>
