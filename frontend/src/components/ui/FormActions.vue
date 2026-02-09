<template>
  <footer class="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300 gap-4">
    
    <div class="text-xs font-medium text-slate-400 dark:text-slate-500">
      <slot name="left"></slot>
    </div>

    <div class="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
      
      <Button
        v-if="showDelete && isEdit && canDelete"
        v-can="permDelete"
        variant="ghost" 
        class="!text-slate-500 hover:!text-red-600 dark:hover:bg-red-500/10 !px-3 !rounded-lg"
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
        class="!rounded-lg px-4"
      >
        <i class="pi pi-cog text-xs mr-2"></i> 
        Produção
      </Button>

<Button
  v-if="showSave"
  v-can="isEdit ? permEdit : permCreate"
  variant="primary"
  type="button"
  :loading="loadingSave"
  class="min-w-[140px] !rounded-lg shadow-sm font-medium"
  @click="emit('save')"
>

        <i class="pi pi-check text-xs mr-2"></i>
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
  labelCreate: String
})

const emit = defineEmits(['save', 'delete', 'production'])
</script>