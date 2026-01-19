<template>
  <div class="space-y-4">
    <div
      v-for="step in steps"
      :key="step.key"
      class="flex items-start gap-4 transition-all duration-300"
    >
      <div
        class="mt-1 h-3.5 w-3.5 rounded-full border-2 transition-colors duration-300"
        :class="dotClass(step)"
      ></div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-3">
          <div class="text-[11px] font-black uppercase tracking-[0.15em] transition-colors duration-300" :class="textClass(step)">
            {{ step.label }}
          </div>

          <div
            v-if="step.dataKey && datas?.[step.dataKey]"
            class="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap"
          >
            {{ formatDate(datas[step.dataKey]) }}
          </div>
        </div>

        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mt-0.5">
          {{ step.fase }}
          <span v-if="step.temTela === false" class="ml-2 opacity-50">• sem página</span>
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

function idxOf(step) {
  return steps.value.findIndex(s => s.key === step.key)
}

function isDone(step) {
  return idxOf(step) >= 0 && idxOf(step) < idxAtual.value
}

function isCurrent(step) {
  return step.key === props.statusAtual
}

// CORES DOS MARCADORES ADAPTÁVEIS
function dotClass(step) {
  // Passo Atual: Azul Brand (Brilha no Dark)
  if (isCurrent(step)) return 'bg-brand-primary border-brand-primary shadow-[0_0_10px_rgba(58,120,168,0.4)]'
  
  // Passo Concluído: Cor do texto principal (Preto no Light / Branco no Dark)
  if (isDone(step)) return 'bg-[var(--text-main)] border-[var(--text-main)]'
  
  // Passo Pendente: Cor da borda do sistema
  return 'bg-transparent border-[var(--border-ui)]'
}

// CORES DO TEXTO ADAPTÁVEIS
function textClass(step) {
  if (isCurrent(step)) return 'text-brand-primary'
  if (isDone(step)) return 'text-[var(--text-main)] opacity-90'
  return 'text-slate-400 dark:text-slate-600'
}

function formatDate(value) {
  return format?.date ? format.date(value) : new Date(value).toLocaleDateString('pt-BR')
}
</script>