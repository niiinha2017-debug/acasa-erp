<template>
  <footer class="flex flex-col sm:flex-row items-center justify-between mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300 gap-6">
    
    <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
      <slot name="left"></slot>
    </div>

    <div class="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
      
      <Button
        v-if="showDelete && isEdit && canDelete"
        v-can="permDelete"
        variant="ghost" 
        class="!text-slate-400 hover:!text-red-500 dark:hover:bg-red-500/5 px-4 !rounded-lg"
        type="button"
        @click="$emit('delete')"
        :loading="loadingDelete"
      >
        <i class="pi pi-trash text-[10px] mr-2"></i>
        Excluir
      </Button>

      <Button
        v-if="showProduction"
        v-can="permProduction"
        variant="secondary"
        type="button"
        @click="$emit('production')"
        class="!rounded-lg px-5"
      >
        <i class="pi pi-cog text-[10px] mr-2"></i> 
        Produção
      </Button>

<Button
  v-if="showSave"
  v-can="isEdit ? permEdit : permCreate"
  variant="primary"
  type="button"
  :loading="loadingSave"
  class="min-w-[180px] !rounded-lg shadow-sm font-bold"
  @click="emit('save')"
>

        <i class="pi pi-check text-[10px] mr-2"></i>
        {{ isEdit ? 'Salvar Alterações' : labelCreate || 'Cadastrar' }}
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