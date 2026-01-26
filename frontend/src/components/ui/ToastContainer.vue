<template>
  <div class="fixed top-6 right-6 z-[10000] flex flex-col gap-3 w-full max-w-[360px] pointer-events-none">
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
              ? 'border-red-100 dark:border-red-900/30' 
              : 'border-emerald-100 dark:border-emerald-900/30'
          ]"
        >
          <div 
            class="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
            :class="n.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'"
          ></div>

          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            :class="n.type === 'error' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'"
          >
            <i :class="[n.type === 'error' ? 'pi pi-times-circle' : 'pi pi-check-circle', 'text-lg']"></i>
          </div>

          <div class="flex flex-col min-w-0 pr-4">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {{ n.type === 'error' ? 'Atenção' : 'Sucesso' }}
            </span>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug truncate">
              {{ n.message }}
            </p>
          </div>

          <button 
            @click="n.remove()" 
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