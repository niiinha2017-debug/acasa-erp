<template>
  <Card 
    :hoverable="true" 
    :variant="variant"
    :active="active"
    class="ds-metric-card group p-5"
  >
    <div class="flex items-center gap-4">
      <div 
        class="ds-metric-card__icon transition-all duration-300 group-hover:shadow-md"
        :class="iconBackground"
      >
        <i :class="['pi text-lg transition-transform duration-500 group-hover:rotate-12', icon]"></i>
      </div>

      <div class="flex flex-col">
        <p 
          class="ds-metric-card__label"
          :class="variant === 'dark' ? 'text-slate-400' : 'text-text-soft'"
        >
          {{ label }}
        </p>
        
        <p 
          class="ds-metric-card__value mt-0.5"
          :class="variant === 'dark' ? 'text-white' : 'text-text-main'"
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
    blue: 'bg-brand-primary/10 text-brand-primary',
    emerald: 'bg-success/10 text-success',
    amber: 'bg-warning/12 text-warning',
    red: 'bg-danger/10 text-danger',
    slate: 'bg-bg-page text-text-main'
  }
  return colors[props.color] || colors.slate
})
</script>