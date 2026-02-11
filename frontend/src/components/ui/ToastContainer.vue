<template>
  <div class="fixed top-6 right-6 z-[10000] flex flex-col gap-3 w-full max-w-[360px] pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="n in notifications" 
        :key="n.id"
        class="pointer-events-auto group"
      >
        <div 
          class="relative flex items-center gap-3 p-3 rounded-lg border-l-4 transition duration-300 ease-in-out hover:scale-[1.02]"
          :class="[cfg(n.type).bg, cfg(n.type).border, cfg(n.type).text]"
        >
          <div class="flex-shrink-0">
            <i :class="[cfg(n.type).icon, cfg(n.type).iconColor, 'text-lg']"></i>
          </div>

          <div class="flex flex-col min-w-0 pr-4 gap-0.5">
            <span class="text-xs font-semibold">
              {{ cfg(n.type).label }}
            </span>
            <p class="text-xs font-semibold leading-snug truncate">
              {{ n.message }}
            </p>
          </div>

          <button 
            @click="notify.remove(n.id)" 
            class="ml-auto opacity-70 hover:opacity-100 transition"
          >
            <i class="pi pi-times text-[10px]"></i>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { notifications, notify } from '@/services/notify'

const typeConfig = {
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-900',
    border: 'border-emerald-500 dark:border-emerald-700',
    text: 'text-emerald-900 dark:text-emerald-100',
    icon: 'pi pi-check-circle',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    label: 'Sucesso',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    border: 'border-blue-500 dark:border-blue-700',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'pi pi-info-circle',
    iconColor: 'text-blue-600 dark:text-blue-300',
    label: 'Info',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    border: 'border-yellow-500 dark:border-yellow-700',
    text: 'text-yellow-900 dark:text-yellow-100',
    icon: 'pi pi-exclamation-triangle',
    iconColor: 'text-yellow-600 dark:text-yellow-300',
    label: 'Atenção',
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900',
    border: 'border-red-500 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    icon: 'pi pi-times-circle',
    iconColor: 'text-red-600 dark:text-red-300',
    label: 'Erro',
  },
}

const cfg = (type) => typeConfig[type] || typeConfig.success
</script>

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
