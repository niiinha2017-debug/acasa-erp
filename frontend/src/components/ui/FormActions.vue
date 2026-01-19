<template>
  <footer class="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border-ui)] transition-colors duration-300">
    
    <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
      <slot name="left"></slot>
    </div>

    <div class="flex items-center gap-4">
      <Button
        v-if="showDelete && isEdit && canDelete"
        v-can="permDelete"
        variant="ghost" 
        class="text-red-400 hover:text-red-500 dark:hover:bg-red-500/10 px-5 transition-all !rounded-xl"
        type="button"
        @click="$emit('delete')"
        :loading="loadingDelete"
      >
        <i class="pi pi-trash mr-2 text-[10px]"></i>
        Excluir
      </Button>

      <Button
        v-if="showProduction"
        v-can="permProduction"
        variant="secondary"
        type="button"
        @click="$emit('production')"
        class="px-6"
      >
        <i class="pi pi-cog mr-2 text-[10px]"></i> 
        Enviar para Produção
      </Button>

      <Button
        v-if="showSave"
        v-can="isEdit ? permEdit : permCreate"
        variant="primary"
        type="submit"
        :loading="loadingSave"
        class="min-w-[160px] shadow-lg shadow-brand-primary/10"
      >
        <i class="pi pi-check mr-2 text-[10px]"></i>
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

defineEmits(['delete', 'production'])
</script>