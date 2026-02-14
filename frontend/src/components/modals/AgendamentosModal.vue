<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" @click.self="close">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
      <button @click="close" class="absolute top-3 right-3 text-slate-400 hover:text-rose-500"><i class="pi pi-times"></i></button>
      <h2 class="text-lg font-black mb-1">Agendar etapa</h2>
      <p class="text-xs font-semibold text-slate-500 mb-4">
        {{ cliente?.nome_completo || cliente?.razao_social || 'Cliente' }}
      </p>

      <div v-if="hasEtapas" class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</div>
          <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase" :class="statusBadgeClass">
            {{ statusLabel || 'Sem status' }}
          </span>
        </div>

        <div>
          <label class="block text-xs font-bold mb-1">Funcionario</label>
          <div v-if="isAdmin">
            <select v-model="funcionarioId" class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700">
              <option value="">Selecione</option>
              <option v-for="f in funcionarios" :key="f.id" :value="f.id">{{ f.nome }}</option>
            </select>
          </div>
          <div v-else class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 flex items-center text-sm font-bold text-slate-700">
            {{ funcionarioNome || 'Nao informado' }}
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold mb-1">Data e horario</label>
          <input
            type="datetime-local"
            v-model="dataHora"
            class="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700"
          />
        </div>
      </div>
      <div v-else class="text-xs font-semibold text-slate-500">
        Nenhuma etapa disponivel para agendamento.
      </div>

      <button @click="salvar" class="w-full mt-4 h-12 rounded-xl font-black text-[10px] uppercase bg-blue-700 text-white shadow">Salvar agendamento</button>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  cliente: Object,
  pipeline: Array,
  isAdmin: Boolean,
  funcionarios: Array,
  funcionarioNome: String,
})
const emit = defineEmits(['close', 'salvar'])

const funcionarioId = ref('')
const dataHora = ref('')
const hasEtapas = computed(() => Array.isArray(props.pipeline) && props.pipeline.length > 0)

const sortedPipeline = computed(() =>
  [...(props.pipeline || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
)

const nextStage = computed(() => {
  const currentKey = props.cliente?.pipeline_status
  const idx = sortedPipeline.value.findIndex((p) => p.key === currentKey)
  return idx >= 0
    ? sortedPipeline.value[idx + 1]
    : sortedPipeline.value.find((p) => p.temTela) || sortedPipeline.value[0]
})

const categoriaToStatusKey = {
  MEDIDA: 'MEDIDA_AGENDADA',
  ORCAMENTO: 'ORCAMENTO_EM_ANDAMENTO',
  MEDIDA_FINA: 'MEDIDA_FINA_AGENDADA',
  PRODUCAO: 'PRODUCAO_AGENDADA',
  MONTAGEM: 'MONTAGEM_AGENDADA',
}

const categoriaKey = computed(() => String(nextStage.value?.fase || '').toUpperCase())
const targetStatusKey = computed(() => categoriaToStatusKey[categoriaKey.value] || nextStage.value?.key || '')

const statusLabel = computed(() => {
  const item = sortedPipeline.value.find((p) => p.key === targetStatusKey.value)
  return item?.label || ''
})

const statusBadgeClass = computed(() => {
  const item = sortedPipeline.value.find((p) => p.key === targetStatusKey.value)
  const fase = item?.fase || ''
  if (fase.includes('MEDIDA')) return 'bg-indigo-50 text-indigo-600 border border-indigo-100'
  if (fase.includes('ORCAMENTO')) return 'bg-amber-50 text-amber-700 border border-amber-100'
  if (fase.includes('PRODUCAO')) return 'bg-blue-50 text-blue-700 border border-blue-100'
  if (fase.includes('MONTAGEM')) return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
  if (fase.includes('FINAL') || fase.includes('ENCERR')) return 'bg-slate-200 text-slate-700 border border-slate-300'
  return 'bg-slate-100 text-slate-600 border border-slate-200'
})

watch(() => props.open, (val) => {
  if (val) {
    funcionarioId.value = ''
    const now = new Date()
    const pad = (v) => String(v).padStart(2, '0')
    dataHora.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  }
})

function close() {
  emit('close')
}
function salvar() {
  emit('salvar', {
    funcionarioId: funcionarioId.value,
    dataHora: dataHora.value,
    statusKey: targetStatusKey.value,
  })
}
</script>
