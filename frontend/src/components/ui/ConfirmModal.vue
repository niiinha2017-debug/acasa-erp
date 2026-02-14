<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="confirmState.isOpen"
        class="confirm-modal-overlay fixed inset-0 w-full h-full min-w-full min-h-full z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;"
        @click.self="confirm.cancel()"
      >
        <div class="bg-bg-card rounded-2xl p-8 w-full max-w-[360px] shadow-2xl border border-border-ui scale-in overflow-hidden relative z-[100000]">
        
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mb-5">
            <i class="pi pi-exclamation-circle text-2xl"></i>
          </div>
          
          <h3 class="text-lg font-semibold text-text-main mb-2">
            {{ confirmState.title }}
          </h3>
          
          <p class="text-sm text-text-soft leading-relaxed mb-6">
            {{ confirmState.message }}
          </p>
        </div>
        
        <div class="flex flex-col gap-3">
          <Button 
            variant="danger" 
            class="w-full h-10 !rounded-lg font-medium shadow-sm" 
            @click="confirm.confirm()"
          >
            Confirmar
          </Button>
          
          <Button 
            variant="secondary" 
            class="w-full h-10 !rounded-lg" 
            @click="confirm.cancel()"
          >
            Cancelar
          </Button>
        </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { confirmState, confirm } from '@/services/confirm'
</script>

<style scoped>
.scale-in {
  animation: modal-appear 0.25s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes modal-appear {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style>
/* Global: overlay no body para Tauri/Capacitor/APK - evita stacking context do layout */
.confirm-modal-overlay {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  min-width: 100vw !important;
  min-height: 100vh !important;
}
</style>
