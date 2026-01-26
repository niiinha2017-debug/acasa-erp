<template>
  <Card 
    :hoverable="true" 
    :variant="variant"
    :active="active"
    class="group p-5"
  >
    <div class="flex items-center gap-5">
      <div 
        class="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
        :class="iconBackground"
      >
        <i :class="['pi text-xl transition-transform duration-500 group-hover:rotate-12', icon]"></i>
      </div>

      <div class="flex flex-col gap-0.5">
        <p 
          class="text-[11px] font-bold uppercase tracking-widest"
          :class="variant === 'dark' ? 'text-slate-400' : 'text-slate-400'"
        >
          {{ label }}
        </p>
        
        <p 
          class="text-2xl font-bold tracking-tight leading-none"
          :class="variant === 'dark' ? 'text-white' : 'text-slate-800 dark:text-slate-100'"
        >
          {{ value }}
        </p>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  active: Boolean,
  variant: { type: String, default: 'default' },
  color: { type: String, default: 'slate' }
})

const iconBackground = computed(() => {
  if (props.variant === 'dark') return 'bg-white/10 text-white shadow-inner'
  
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 shadow-blue-500/5',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-emerald-500/5',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 shadow-amber-500/5',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 shadow-red-500/5',
    slate: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 shadow-slate-500/5'
  }
  return colors[props.color] || colors.slate
})
</script>