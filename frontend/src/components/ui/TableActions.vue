<template>
  <div class="flex items-center justify-end gap-1 px-1">
    <Button
      v-can="permEdit"
      variant="ghost"
      size="sm"
      class="!h-8 !px-2.5 !rounded-lg text-text-soft hover:!text-brand-primary hover:!bg-brand-primary/10 transition-all duration-200 group/btn"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil text-xs group-hover/btn:rotate-12 transition-transform"></i>
      <span v-if="showLabel" class="ml-1.5 text-[11px] font-semibold uppercase tracking-wide">Editar</span>
    </Button>

    <Button
      v-can="permDelete"
      variant="ghost"
      size="sm"
      class="!h-8 !px-2.5 !rounded-lg text-text-soft hover:!text-rose-500 hover:!bg-rose-500/10 transition-all duration-200 group/btn"
      @click.stop="$emit('delete', id)"
      title="Excluir"
    >
      <i class="pi pi-trash text-xs group-hover/btn:scale-110 transition-transform"></i>
      <span v-if="showLabel" class="ml-1.5 text-[11px] font-semibold uppercase tracking-wide">Excluir</span>
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
