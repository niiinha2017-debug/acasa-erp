<template>
  <div :class="['ds-shell-card overflow-hidden', { 'ds-shell-card--minimal': variant === 'minimal' }]">
    <header :class="['ds-header-block', { 'ds-header-block--minimal': variant === 'minimal' }]">
      <div class="flex items-center gap-4 min-w-0">
        <div v-if="icon" :class="['ds-header-icon', { 'ds-header-icon--minimal': variant === 'minimal' }]">
          <i :class="icon"></i>
        </div>

        <div class="min-w-0 flex-1 flex flex-col gap-1">
          <h1 class="ds-header-title">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="ds-header-subtitle break-words">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div class="ds-header-actions justify-start sm:justify-end gap-y-2">
        <slot name="actions" />
      </div>
    </header>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  variant: { type: String, default: 'default' },
})
</script>
