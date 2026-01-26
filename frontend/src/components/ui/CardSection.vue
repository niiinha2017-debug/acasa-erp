<template>
  <div 
    class="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
  >
    <div v-if="title || $slots.header" class="px-6 py-5 border-b border-slate-50 dark:border-slate-800">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-0.5">
          <h3 v-if="title" class="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            {{ title }}
          </h3>
          <p v-if="description" class="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
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

    <div v-if="$slots.footer" class="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-50 dark:border-slate-800">
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