<template>
  <div 
    class="w-full bg-bg-card border border-border-ui rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
  >
    <div v-if="title || $slots.header" class="px-6 py-4 border-b border-border-ui">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-0.5">
          <h3 v-if="title" class="text-base font-semibold text-text-main">
            {{ title }}
          </h3>
          <p v-if="description" class="text-sm font-normal text-text-soft">
            {{ description }}
          </p>
        </div>
        <div class="flex-shrink-0">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <div class="px-6 py-6 md:px-8 md:py-8">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 bg-slate-50/60 dark:bg-slate-900/50 border-t border-border-ui">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String
})
</script>
