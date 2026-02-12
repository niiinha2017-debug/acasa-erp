<template>
  <div class="flex items-center justify-end gap-2 px-1">
    <button
      v-can="permEdit"
      class="h-8 px-3 rounded-md border border-border-ui text-text-muted bg-bg-card
             hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5
             transition-all duration-200 flex items-center gap-2"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil text-sm"></i>
      <span v-if="showLabel" class="text-[11px] font-semibold uppercase tracking-wide">Editar</span>
    </button>

    <button
      v-can="permDelete"
      class="h-8 px-3 rounded-md border border-red-200/70 text-red-500 dark:text-red-400 bg-bg-card
             hover:text-red-600 hover:border-red-300 hover:bg-red-50/60 dark:hover:bg-red-900/20
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
