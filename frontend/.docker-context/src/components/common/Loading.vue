<template>
  <div class="w-full py-16 flex items-center justify-center transition-all duration-500">
    <div class="flex flex-col items-center gap-5">
      <div class="relative w-12 h-12">
        <div class="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-t-brand-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      
      <div class="flex flex-col items-center gap-1">
        <span class="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 animate-pulse">
          Sincronizando
        </span>
        <div class="w-12 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div class="w-full h-full bg-brand-primary/40 animate-loading-bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-loading-bar {
  animation: loading-bar 1.5s infinite linear;
}
</style>