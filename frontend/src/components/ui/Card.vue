<template>
  <div :class="['card', { 'hoverable': hoverable, 'shadow': shadow }]">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="card-body">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  hoverable: {
    type: Boolean,
    default: false
  },
  shadow: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card.shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
</style>