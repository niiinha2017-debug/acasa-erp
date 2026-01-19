<template>
  <div class="flex items-center justify-end gap-1 px-2">
    <Button
      v-can="permEdit"
      variant="ghost"
      size="sm"
      class="!p-2.5 !rounded-xl text-slate-400 dark:text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-all duration-300 group/btn"
      title="Editar Registro"
      @click.stop="$emit('edit', id)"
    >
      <i class="pi pi-pencil text-[12px] group-hover/btn:scale-110 transition-transform"></i>
      <span v-if="showLabel" class="ml-2 text-[10px] font-black uppercase tracking-[0.15em]">Editar</span>
    </Button>

    <Button
      v-can="permDelete"
      variant="ghost"
      size="sm"
      class="!p-2.5 !rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 group/btn"
      title="Excluir Registro"
      @click.stop="$emit('delete', id)"
    >
      <i class="pi pi-trash text-[12px] group-hover/btn:scale-110 transition-transform"></i>
      <span v-if="showLabel" class="ml-2 text-[10px] font-black uppercase tracking-[0.15em]">Excluir</span>
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