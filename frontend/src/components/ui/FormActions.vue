<template>
  <footer class="ds-form-actions mt-8 transition-colors duration-300">
    <div class="ds-section-note">
      <slot name="left"></slot>
    </div>

    <div class="ds-form-actions__group w-full sm:w-auto justify-center sm:justify-end">
      <Button
        v-if="showDelete && isEdit && canDelete"
        v-can="permDelete"
        variant="ghost"
        class="ds-inline-action ds-inline-action--danger"
        type="button"
        @click="$emit('delete')"
        :loading="loadingDelete"
      >
        <i class="pi pi-trash text-xs mr-2"></i>
        Excluir
      </Button>

      <Button
        v-if="showProduction"
        v-can="permProduction"
        variant="secondary"
        type="button"
        @click="$emit('production')"
        class="min-w-[132px]"
      >
        <i class="pi pi-cog text-xs"></i>
        Producao
      </Button>

      <Button
        v-if="showSave"
        v-can="isEdit ? permEdit : permCreate"
        variant="primary"
        type="button"
        :loading="loadingSave"
        class="min-w-[148px]"
        @click="emit('save')"
      >
        <i class="pi pi-check text-xs"></i>
        {{ isEdit ? 'Salvar' : labelCreate || 'Cadastrar' }}
      </Button>
    </div>
  </footer>
</template>

<script setup>
import Button from './Button.vue'

defineProps({
  isEdit: Boolean,
  loadingSave: Boolean,
  loadingDelete: Boolean,
  showSave: { type: Boolean, default: true },
  showDelete: { type: Boolean, default: true },
  showProduction: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: true },
  permCreate: String,
  permEdit: String,
  permDelete: String,
  permProduction: String,
  labelCreate: String,
})

const emit = defineEmits(['save', 'delete', 'production'])
</script>
