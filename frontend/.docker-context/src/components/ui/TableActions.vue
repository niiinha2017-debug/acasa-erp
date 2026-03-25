<template>
  <div class="inline-flex items-center justify-end gap-1.5 flex-nowrap">
    <button
      v-can="permEdit"
      type="button"
      class="h-8 px-2.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 flex items-center gap-1.5 transition-colors text-[11px] font-medium whitespace-nowrap shrink-0"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil text-[12px]"></i>
      <span v-if="showLabel">Editar</span>
    </button>

    <button
      v-can="permDelete"
      type="button"
      class="h-8 px-2.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors text-[11px] font-medium whitespace-nowrap shrink-0"
      @click.stop="$emit('delete', id)"
      title="Excluir"
    >
      <i class="pi pi-trash text-[12px]"></i>
      <span v-if="showLabel">Excluir</span>
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
