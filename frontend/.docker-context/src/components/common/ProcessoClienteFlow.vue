<template>
  <div class="relative flex flex-col gap-0">
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex items-start gap-4 pb-8 last:pb-0 group"
    >
      <div
        v-if="index !== steps.length - 1"
        class="absolute left-[6px] top-4 w-[2px] h-full transition-colors duration-500"
        :class="linhaClass(step)"
      ></div>

      <!-- Ícone check sutil para etapa concluída; dot na cor do status para etapa atual -->
      <div
        v-if="isDone(step)"
        class="relative z-10 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400 transition-all duration-300"
      >
        <i class="pi pi-check text-[8px]" />
      </div>
      <div
        v-else
        class="relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full transition-all duration-300 border-2 bg-white dark:bg-slate-900"
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
            v-if="(step.dataKey || step.disparaComData) && datas?.[step.dataKey || step.disparaComData]"
            class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md"
          >
            {{ formatDate(datas[step.dataKey || step.disparaComData]) }}
          </div>
        </div>

        <div v-if="step.fase" class="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-tight mt-0.5">
          {{ step.fase }}
          <span v-if="step.temTela === false" class="ml-2 italic opacity-60">• offline</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  ETAPAS_OFICIAL_10,
  getEtapaKeyByCategoria,
  getStepTextClassEtapa,
  getStatusLineBgClass,
  getStatusStepperDotClass,
} from '@/constantes'
import { format } from '@/utils/format'

const props = defineProps({
  statusAtual: { type: String, default: '' },
  datas: { type: Object, default: () => ({}) },
})

const steps = computed(() => [...ETAPAS_OFICIAL_10].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))

const etapaAtualKey = computed(() => getEtapaKeyByCategoria(props.statusAtual))

const idxAtual = computed(() => {
  const i = steps.value.findIndex((s) => s.key === etapaAtualKey.value)
  return i < 0 ? 0 : i
})

const idxOf = (step) => steps.value.findIndex((s) => s.key === step.key)
const isDone = (step) => idxOf(step) < idxAtual.value
const isCurrent = (step) => step.key === etapaAtualKey.value

function stateFor(step) {
  if (isCurrent(step)) return 'em_andamento'
  if (isDone(step)) return 'concluido'
  return 'agendado'
}

function linhaClass(step) {
  if (isCurrent(step)) return getStatusLineBgClass(step.key)
  if (isDone(step)) return '!bg-slate-300 dark:!bg-slate-600'
  return 'bg-slate-100 dark:bg-slate-800'
}

function dotClass(step) {
  if (isCurrent(step)) return getStatusStepperDotClass(step.key)
  return 'border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800'
}

function textClass(step) {
  return getStepTextClassEtapa(step.key, stateFor(step))
}

function formatDate(value) {
  return format?.date ? format.date(value) : new Date(value).toLocaleDateString('pt-BR')
}
</script>