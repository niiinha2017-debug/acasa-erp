<template>
  <div class="ds-table-actions">
    <button
      v-can="permEdit"
      type="button"
      class="ds-table-action"
      @click.stop="$emit('edit', id)"
      title="Editar"
    >
      <i class="pi pi-pencil ds-table-action__icon"></i>
      <span v-if="showLabel">Editar</span>
    </button>

    <button
      v-can="permDelete"
      type="button"
      class="ds-table-action ds-table-action--danger"
      @click.stop="$emit('delete', id)"
      title="Excluir"
    >
      <i class="pi pi-trash ds-table-action__icon"></i>
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
