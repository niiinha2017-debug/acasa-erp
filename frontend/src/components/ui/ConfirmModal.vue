<template>
  <Transition name="fade">
    <div 
      v-if="confirmState.isOpen" 
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-300"
      @click.self="confirm.cancel()"
    >
      <div class="bg-[var(--bg-card)] rounded-[2.5rem] p-10 w-full max-w-sm shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-[var(--border-ui)] scale-in transition-colors duration-300">
        
        <div class="flex flex-col items-center text-center mb-6">
          <div class="p-5 bg-red-500/10 text-red-500 rounded-[1.5rem] mb-5 shadow-inner">
            <i class="pi pi-exclamation-triangle text-3xl"></i>
          </div>
          
          <h3 class="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none">
            {{ confirmState.title }}
          </h3>
        </div>
        
        <p class="text-slate-400 dark:text-slate-500 text-center font-bold text-sm mb-10 leading-relaxed px-2">
          {{ confirmState.message }}
        </p>
        
        <div class="flex gap-4">
          <Button 
            variant="secondary" 
            class="flex-1 h-12" 
            @click="confirm.cancel()"
          >
            Voltar
          </Button>
          
          <Button 
            variant="danger" 
            class="flex-1 h-12 shadow-lg shadow-red-500/20" 
            @click="confirm.confirm()"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { confirmState, confirm } from '@/services/confirm'
</script>

<style scoped>
.scale-in { 
  animation: scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
}

@keyframes scale { 
  from { transform: scale(0.9); opacity: 0; } 
  to { transform: scale(1); opacity: 1; } 
}

/* Transição de Fade para o Backdrop */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>