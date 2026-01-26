<template>
  <div class="relative flex flex-col gap-0">
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex items-start gap-4 pb-8 last:pb-0 group"
    >
      <div 
        v-if="index !== steps.length - 1"
        class="absolute left-[6px] top-4 w-[2px] h-full bg-slate-100 dark:bg-slate-800 transition-colors duration-500"
        :class="{ '!bg-brand-primary/30': isDone(step) || isCurrent(step) }"
      ></div>

      <div
        class="relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-2 transition-all duration-300"
        :class="dotClass(step)"
      ></div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-3">
          <div 
            class="text-[11px] font-bold uppercase tracking-wider transition-colors duration-300" 
            :class="textClass(step)"
          >
            {{ step.label }}
          </div>

          <div
            v-if="step.dataKey && datas?.[step.dataKey]"
            class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md"
          >
            {{ formatDate(datas[step.dataKey]) }}
          </div>
        </div>

        <div class="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-tight mt-0.5">
          {{ step.fase }}
          <span v-if="step.temTela === false" class="ml-2 italic opacity-60">• offline</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PIPELINE_CLIENTE } from '@/constantes'
import { format } from '@/utils/format'

const props = defineProps({
  statusAtual: { type: String, default: '' },
  datas: { type: Object, default: () => ({}) },
})

const steps = computed(() => {
  const arr = Array.isArray(PIPELINE_CLIENTE) ? PIPELINE_CLIENTE : []
  return [...arr].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
})

const idxAtual = computed(() => {
  const i = steps.value.findIndex(s => s.key === props.statusAtual)
  return i < 0 ? 0 : i
})

const idxOf = (step) => steps.value.findIndex(s => s.key === step.key)
const isDone = (step) => idxOf(step) < idxAtual.value
const isCurrent = (step) => step.key === props.statusAtual

function dotClass(step) {
  if (isCurrent(step)) return 'bg-white dark:bg-slate-900 border-brand-primary shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.4)]'
  if (isDone(step)) return 'bg-brand-primary border-brand-primary'
  return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
}

function textClass(step) {
  if (isCurrent(step)) return 'text-slate-800 dark:text-slate-100'
  if (isDone(step)) return 'text-slate-500 dark:text-slate-400'
  return 'text-slate-300 dark:text-slate-600'
}

function formatDate(value) {
  return format?.date ? format.date(value) : new Date(value).toLocaleDateString('pt-BR')
}
</script>