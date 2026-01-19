<template>
  <div 
    class="w-full bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-xl shadow-black/5"
  >
    <div v-if="title || $slots.header" class="px-10 py-8 border-b border-[var(--border-ui)]">
      <div class="flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1.5">
          <h3 v-if="title" class="text-lg font-black uppercase tracking-tight text-[var(--text-main)] transition-colors">
            {{ title }}
          </h3>
          <p v-if="description" class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
            {{ description }}
          </p>
        </div>
        <div class="flex-shrink-0">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <div class="px-10 py-10">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-10 py-6 bg-slate-500/5 border-t border-[var(--border-ui)]">
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