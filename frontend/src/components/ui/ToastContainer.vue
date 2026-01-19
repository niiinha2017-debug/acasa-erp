<script setup>
// Verifique se o caminho para o seu serviço de notificações está correto
import { notifications } from '@/services/notify' 
</script>

<template>
  <div class="fixed top-8 right-8 z-[10000] flex flex-col gap-4 w-full max-w-[380px] pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="n in notifications" 
        :key="n.id"
        class="pointer-events-auto relative overflow-hidden group"
      >
        <div 
          class="flex items-center gap-4 p-5 rounded-[1.5rem] border backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300"
          :class="[
            n.type === 'error' 
              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          ]"
        >
          <div 
            class="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
            :class="n.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'"
          ></div>

          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
            :class="n.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'"
          >
            <i :class="[n.type === 'error' ? 'pi pi-times-circle' : 'pi pi-check-circle', 'text-xl']"></i>
          </div>

          <div class="flex flex-col gap-0.5">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
              {{ n.type === 'error' ? 'Falha no Sistema' : 'Sucesso' }}
            </span>
            <p class="text-[13px] font-bold text-[var(--text-main)] leading-tight">
              {{ n.message }}
            </p>
          </div>

          <button 
            @click="n.remove()" 
            class="ml-auto text-[var(--text-main)] opacity-20 hover:opacity-100 p-1 transition-opacity"
          >
            <i class="pi pi-times text-[10px]"></i>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { 
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); 
}
.toast-enter-from { 
  opacity: 0; 
  transform: translateX(50px) scale(0.9); 
}
.toast-leave-to { 
  opacity: 0; 
  transform: translateX(100px) scale(0.8); 
}
.toast-move {
  transition: transform 0.5s ease;
}
</style>