<template>
  <div class="flex items-center justify-end gap-1 px-1">
    <Button
      v-can="permEdit"
      variant="ghost"
      size="sm"
      class="!p-2 !rounded-md text-slate-400 dark:text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-200 group/btn"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil text-xs group-hover/btn:rotate-12 transition-transform"></i>
      <span v-if="showLabel" class="ml-2 text-xs font-medium">Editar</span>
    </Button>

    <Button
      v-can="permDelete"
      variant="ghost"
      size="sm"
      class="!p-2 !rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-500/5 transition-all duration-200 group/btn"
      @click.stop="$emit('delete', id)"
      title="Excluir"
    >
      <i class="pi pi-trash text-xs group-hover/btn:scale-110 transition-transform"></i>
      <span v-if="showLabel" class="ml-2 text-xs font-medium">Excluir</span>
    </Button>

    <slot></slot>
  </div>
</template>

<script setup>
import Button from './Button.vue'

defineProps({
  id: { type: [String, Number], required: true },
  permEdit: String,
  permDelete: String,
  showLabel: { type: Boolean, default: false }
})

defineEmits(['edit', 'delete'])
</script>