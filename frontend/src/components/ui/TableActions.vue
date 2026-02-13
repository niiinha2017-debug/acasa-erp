<template>
  <div class="ml-auto inline-flex items-center justify-end gap-1 rounded-xl border border-border-ui bg-bg-card p-1 shadow-sm">
    <Button
      v-can="permEdit"
      variant="ghost"
      size="sm"
      class="!h-8 !px-2.5 !min-w-[88px] !rounded-lg !justify-center text-slate-500 dark:text-slate-300 hover:!text-brand-primary hover:!bg-brand-primary/10 focus-visible:!ring-2 focus-visible:!ring-brand-primary/20 transition-all duration-200 group/btn"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil text-xs group-hover/btn:-translate-y-[1px] group-hover/btn:scale-110 transition-transform"></i>
      <span v-if="showLabel" class="text-[10px] font-bold uppercase tracking-wide">Editar</span>
    </Button>

    <Button
      v-can="permDelete"
      variant="ghost"
      size="sm"
      class="!h-8 !px-2.5 !min-w-[88px] !rounded-lg !justify-center text-slate-500 dark:text-slate-300 hover:!text-rose-500 hover:!bg-rose-500/10 focus-visible:!ring-2 focus-visible:!ring-rose-500/20 transition-all duration-200 group/btn"
      @click.stop="$emit('delete', id)"
      title="Excluir"
    >
      <i class="pi pi-trash text-xs group-hover/btn:scale-110 transition-transform"></i>
      <span v-if="showLabel" class="text-[10px] font-bold uppercase tracking-wide">Excluir</span>
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
  showLabel: { type: Boolean, default: true }
})

defineEmits(['edit', 'delete'])
</script>
