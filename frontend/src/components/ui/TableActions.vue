<template>
  <div class="flex items-center justify-end gap-2 px-1">
    <button
      v-can="permEdit"
      class="h-9 px-3.5 rounded-full border border-slate-200/70 text-slate-600 dark:text-slate-300
             bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-800/60
             hover:text-brand-primary hover:border-brand-primary/40 hover:shadow-sm hover:shadow-brand-primary/10
             transition-all duration-200 flex items-center gap-2"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil text-sm"></i>
      <span v-if="showLabel" class="text-[11px] font-semibold uppercase tracking-wide">Editar</span>
    </button>

    <button
      v-can="permDelete"
      class="h-9 px-3.5 rounded-full border border-red-200/70 text-red-500 dark:text-red-400
             bg-gradient-to-b from-white to-red-50/60 dark:from-slate-900 dark:to-red-900/10
             hover:text-red-600 hover:border-red-300 hover:shadow-sm hover:shadow-red-500/10
             transition-all duration-200 flex items-center gap-2"
      @click.stop="$emit('delete', id)"
      title="Excluir"
    >
      <i class="pi pi-trash text-sm"></i>
      <span v-if="showLabel" class="text-[11px] font-semibold uppercase tracking-wide">Excluir</span>
    </button>

    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  id: { type: [String, Number], required: true },
  permEdit: String,
  permDelete: String,
  showLabel: { type: Boolean, default: true }
})

defineEmits(['edit', 'delete'])
</script>
