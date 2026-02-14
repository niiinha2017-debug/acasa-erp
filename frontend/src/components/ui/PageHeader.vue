<template>
  <div class="flex flex-col border-b border-border-ui">
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-6 py-6 md:px-8">
      <div class="flex items-center gap-4 min-w-0">
        <div v-if="icon" class="flex-shrink-0 text-text-soft text-2xl">
          <i :class="icon"></i>
        </div>

        <div class="min-w-0 flex flex-col gap-1">
          <h1 class="text-2xl font-semibold text-text-main">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-sm text-text-soft">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
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
})
</script>
