<template>
  <Card 
    :hoverable="true" 
    :variant="variant"
    :active="active"
    class="group p-5"
  >
    <div class="flex items-center gap-4">
      <div 
        class="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-md"
        :class="iconBackground"
      >
        <i :class="['pi text-lg transition-transform duration-500 group-hover:rotate-12', icon]"></i>
      </div>

      <div class="flex flex-col">
        <p 
          class="text-sm font-medium"
          :class="variant === 'dark' ? 'text-slate-400' : 'text-slate-500'"
        >
          {{ label }}
        </p>
        
        <p 
          class="text-2xl font-semibold tracking-tight leading-none mt-0.5"
          :class="variant === 'dark' ? 'text-white' : 'text-slate-900 dark:text-slate-100'"
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