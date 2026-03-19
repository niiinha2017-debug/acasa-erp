<template>
  <section class="rounded-2xl border border-border-ui bg-bg-card p-4 md:p-5 space-y-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="text-sm font-semibold text-text-main truncate">{{ ambiente.nome_ambiente || `Ambiente ${index + 1}` }}</h3>
        <span
          v-if="temDivergencia"
          class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
          title="Medida real diferente da planta"
        >
          <i class="pi pi-exclamation-triangle" />
          Ajuste de projeto
        </span>
      </div>
      <Button v-if="permiteRemover" type="button" variant="ghost" size="sm" class="!rounded-xl !text-rose-600" @click="$emit('remove')">
        <i class="pi pi-trash" />
      </Button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input
        :model-value="inputEstimado.altura"
        type="number"
        step="0.01"
        min="0"
        label="Planta: Altura (m)"
        placeholder="Ex: 2.70"
        :readonly="modoFino"
        @update:model-value="(v) => atualizarEstimado('altura', v)"
      />
      <Input
        :model-value="inputEstimado.largura"
        type="number"
        step="0.01"
        min="0"
        label="Planta: Largura (m)"
        placeholder="Ex: 3.20"
        :readonly="modoFino"
        @update:model-value="(v) => atualizarEstimado('largura', v)"
      />
      <Input
        :model-value="inputEstimado.profundidade"
        type="number"
        step="0.01"
        min="0"
        label="Planta: Profundidade (m)"
        placeholder="Ex: 0.60"
        :readonly="modoFino"
        @update:model-value="(v) => atualizarEstimado('profundidade', v)"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input
        :model-value="inputReal.altura"
        type="number"
        step="0.01"
        min="0"
        label="Real: Altura (m)"
        placeholder="Ex: 2.70"
        :readonly="modoEstimado"
        @update:model-value="(v) => atualizarReal('altura', v)"
      />
      <Input
        :model-value="inputReal.largura"
        type="number"
        step="0.01"
        min="0"
        label="Real: Largura (m)"
        placeholder="Ex: 3.20"
        :readonly="modoEstimado"
        @update:model-value="(v) => atualizarReal('largura', v)"
      />
      <Input
        :model-value="inputReal.profundidade"
        type="number"
        step="0.01"
        min="0"
        label="Real: Profundidade (m)"
        placeholder="Ex: 0.60"
        :readonly="modoEstimado"
        @update:model-value="(v) => atualizarReal('profundidade', v)"
      />
    </div>

    <div v-if="modoFino" class="rounded-xl border border-border-ui bg-bg-page p-3 space-y-2">
      <p class="text-xs font-semibold text-text-soft">Checklist da Medida Fina</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <label class="flex items-center gap-2 text-sm text-text-main">
          <input type="checkbox" :checked="!!checklist.tomadas" @change="(e) => atualizarChecklist('tomadas', e.target.checked)" />
          Tomadas verificadas
        </label>
        <label class="flex items-center gap-2 text-sm text-text-main">
          <input type="checkbox" :checked="!!checklist.prumo" @change="(e) => atualizarChecklist('prumo', e.target.checked)" />
          Prumo ok
        </label>
        <label class="flex items-center gap-2 text-sm text-text-main">
          <input type="checkbox" :checked="!!checklist.esquadro" @change="(e) => atualizarChecklist('esquadro', e.target.checked)" />
          Esquadro ok
        </label>
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-xs font-semibold text-text-soft">Fotos e anotações técnicas</p>
      <div class="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          class="!rounded-xl"
          :disabled="modoEstimado || uploading"
          @click="abrirInputFoto"
        >
          <i class="pi pi-camera mr-2" />
          {{ uploading ? 'Enviando...' : 'Adicionar fotos' }}
        </Button>
      </div>
      <input
        :ref="setInputFotoRef"
        type="file"
        class="hidden"
        accept="image/*"
        capture="environment"
        multiple
        @change="onSelecionarFotos"
      />
      <div v-if="fotos.length" class="flex flex-wrap gap-2">
        <div v-for="foto in fotos" :key="foto.id" class="relative w-16 h-16 rounded-lg overflow-hidden border border-border-ui bg-bg-page">
          <img v-if="foto.url" :src="foto.url" alt="Foto do ambiente" class="w-full h-full object-cover" />
          <span v-else class="absolute inset-0 flex items-center justify-center text-[10px] text-text-soft">Foto</span>
        </div>
      </div>
      <Input
        :model-value="observacoes"
        type="text"
        label="Anotações técnicas"
        placeholder="Hidráulica, elétrica, pontos críticos..."
        :readonly="modoEstimado"
        @update:model-value="(v) => $emit('update-observacoes', v)"
      />
      <p v-if="modoFino && exigeFotoNoFino && fotos.length === 0" class="text-xs text-amber-700">
        Este ambiente precisa de ao menos uma foto na Medida Fina.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

const props = defineProps({
  index: { type: Number, default: 0 },
  ambiente: { type: Object, required: true },
  modo: { type: String, default: 'estimado' }, // estimado | fino
  permiteRemover: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  exigeFotoNoFino: { type: Boolean, default: true },
})

const emit = defineEmits([
  'remove',
  'update-estimado',
  'update-real',
  'update-observacoes',
  'update-checklist',
  'upload-fotos',
])

const inputFotoRef = ref(null)

const modoFino = computed(() => props.modo === 'fino')
const modoEstimado = computed(() => props.modo !== 'fino')

const estimado = computed(() => props.ambiente?.estimado || {})
const checklist = computed(() => props.ambiente?.checklist || {})
const fotos = computed(() => Array.isArray(props.ambiente?.fotos) ? props.ambiente.fotos : [])
const observacoes = computed(() => props.ambiente?.observacoes || '')

const inputReal = computed(() => ({
  altura: props.ambiente?.real?.pe_direito_m ?? '',
  largura: props.ambiente?.real?.largura_m ?? '',
  profundidade: props.ambiente?.real?.profundidade_m ?? '',
}))

const inputEstimado = computed(() => ({
  altura: props.ambiente?.estimado?.pe_direito_m ?? '',
  largura: props.ambiente?.estimado?.largura_m ?? '',
  profundidade: props.ambiente?.estimado?.profundidade_m ?? '',
}))

const temDivergencia = computed(() => {
  const e = estimado.value || {}
  const r = props.ambiente?.real || {}
  const threshold = 0.02
  const dif = (a, b) => {
    const na = Number(a)
    const nb = Number(b)
    if (!Number.isFinite(na) || !Number.isFinite(nb) || na <= 0 || nb <= 0) return false
    return Math.abs(na - nb) > threshold
  }
  return dif(e.largura_m, r.largura_m) || dif(e.pe_direito_m, r.pe_direito_m) || dif(e.profundidade_m, r.profundidade_m)
})

function formatNum(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return '—'
  return n.toFixed(2)
}

function atualizarEstimado(campo, valor) {
  emit('update-estimado', { campo, valor })
}

function atualizarReal(campo, valor) {
  emit('update-real', { campo, valor })
}

function atualizarChecklist(chave, valor) {
  emit('update-checklist', { chave, valor })
}

function setInputFotoRef(el) {
  inputFotoRef.value = el || null
}

function abrirInputFoto() {
  if (modoEstimado.value) return
  inputFotoRef.value?.click()
}

function onSelecionarFotos(event) {
  const files = event?.target?.files ? Array.from(event.target.files) : []
  if (!files.length) return
  emit('upload-fotos', files)
  event.target.value = ''
}
</script>
