<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="confirmState.isOpen"
        class="confirm-modal-overlay ds-modal-overlay z-[100002]"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;"
        @click.self="confirm.cancel()"
      >
        <div class="ds-confirm-modal scale-in overflow-hidden relative z-10">
        
        <div class="flex flex-col items-center text-center">
          <div class="ds-confirm-modal__icon">
            <i class="pi pi-exclamation-circle text-2xl"></i>
          </div>
          
          <h3 class="ds-confirm-modal__title">
            {{ confirmState.title }}
          </h3>
          
          <p class="ds-confirm-modal__message">
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
}
</style>
