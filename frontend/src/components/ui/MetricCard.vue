<template>
  <Card 
    :hoverable="true" 
    :variant="variant"
    :active="active"
    class="p-6"
  >
    <div class="flex items-center gap-4">
      <div 
        class="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
        :class="iconBackground"
      >
        <i :class="['pi text-xl', icon]"></i>
      </div>

      <div>
        <p 
          class="text-[10px] font-black uppercase tracking-[0.15em]"
          :class="variant === 'dark' ? 'text-slate-400' : 'text-slate-500'"
        >
          {{ label }}
        </p>
        <p 
          class="text-2xl font-black tracking-tight"
          :class="variant === 'dark' ? 'text-white' : 'text-[var(--text-main)]'"
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
  // Cores: 'blue', 'emerald', 'amber', 'red', 'slate'
  color: { type: String, default: 'slate' }
})

const iconBackground = computed(() => {
  if (props.variant === 'dark') return 'bg-white/10 text-white'
  
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    slate: 'bg-slate-900/10 text-slate-900'
  }
  return colors[props.color] || colors.slate
})
</script>