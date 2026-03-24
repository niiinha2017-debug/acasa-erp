<script setup>
import { notifications, notify } from '@/services/notify'
</script>

<template>
  <div class="fixed top-6 right-6 z-[10000] flex flex-col gap-3 w-[calc(100%-1.5rem)] max-w-[560px] pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="n in notifications" 
        :key="n.id"
        class="pointer-events-auto group"
      >
        <div 
          class="relative flex items-center gap-4 p-4 rounded-xl border bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 transition-all duration-300"
          :class="[
            n.type === 'error' 
              ? 'border-[color:rgba(196,73,73,0.2)]' 
              : 'border-[color:rgba(22,124,92,0.2)]'
          ]"
        >
          <div 
            class="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
            :class="n.type === 'error' ? 'bg-[color:var(--ds-color-danger)]' : 'bg-[color:var(--ds-color-success)]'"
          ></div>

          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            :class="n.type === 'error' ? 'bg-[color:rgba(196,73,73,0.1)] text-[color:var(--ds-color-danger)]' : 'bg-[color:rgba(22,124,92,0.1)] text-[color:var(--ds-color-success)]'"
          >
            <i :class="[n.type === 'error' ? 'pi pi-times-circle' : 'pi pi-check-circle', 'text-lg']"></i>
          </div>

          <div class="flex flex-col min-w-0 pr-4 gap-1 flex-1">
            <span class="text-xs font-semibold" :class="n.type === 'error' ? 'text-[color:var(--ds-color-danger)]' : 'text-[color:var(--ds-color-success)]'">
              {{ n.type === 'error' ? 'Atenção' : 'Sucesso' }}
            </span>
            <p
              class="text-sm font-medium text-slate-600 dark:text-slate-300 leading-snug break-words whitespace-pre-wrap"
              :class="n.type === 'error' ? 'max-h-40 overflow-y-auto pr-1' : ''"
            >
              {{ n.message }}
            </p>
          </div>

          <button 
            @click="notify.remove(n.id)" 
            class="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
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
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); 
}
.toast-enter-from { 
  opacity: 0; 
  transform: translateX(30px) scale(0.95); 
}
.toast-leave-to { 
  opacity: 0; 
  transform: translateX(30px) scale(0.9); 
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>